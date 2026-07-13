-- MIGRATION E - TRANSIT_OPTIONS
-- Cria a tabela de opções de transporte/logística entre experiências ou zonas.

-- VERIFICAÇÃO OBRIGATÓRIA: a função update_modified_column deve existir antes dos triggers.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_proc.proname = 'update_modified_column'
      AND pg_namespace.nspname = 'public'
  ) THEN
    RAISE EXCEPTION
      'Pré-requisito ausente: a função public.update_modified_column() não existe. '
      'Aplique o schema.sql base antes desta migration.';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.transit_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ON DELETE RESTRICT: ao apagar um destino, o Admin deve resolver as rotas explicitamente primeiro.
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE RESTRICT,
    -- ON DELETE RESTRICT: ao apagar uma experiência de origem/destino, o Admin deve resolver
    -- as rotas afetadas explicitamente. Evita apagamento silencioso de dados editoriais.
    origin_experience_id UUID NULL REFERENCES public.experiences(id) ON DELETE RESTRICT,
    destination_experience_id UUID NULL REFERENCES public.experiences(id) ON DELETE RESTRICT,
    origin_zone TEXT NULL,
    destination_zone TEXT NULL,
    title TEXT NOT NULL,
    modality TEXT NOT NULL,
    description TEXT NULL,
    duration_min_minutes INTEGER NULL,
    duration_avg_minutes INTEGER NULL,
    duration_max_minutes INTEGER NULL,
    price_min NUMERIC NULL,
    price_max NUMERIC NULL,
    currency TEXT NULL,
    frequency_minutes INTEGER NULL,
    operation_notes TEXT NULL,
    transfers_required INTEGER NOT NULL DEFAULT 0,
    luggage_suitability TEXT NULL,
    accessibility TEXT[] NULL,
    booking_required BOOLEAN NOT NULL DEFAULT false,
    booking_url TEXT NULL,
    instructions TEXT NULL,
    source_url TEXT NULL,
    verified_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Valores controlados
    CONSTRAINT chk_transit_modality
      CHECK (modality IN ('walking', 'subway', 'train', 'bus', 'ferry', 'taxi', 'rideshare', 'private_transfer', 'shuttle', 'rental_car', 'mixed')),
    CONSTRAINT chk_transit_luggage
      CHECK (luggage_suitability IS NULL OR luggage_suitability IN ('poor', 'limited', 'suitable', 'excellent')),
    CONSTRAINT chk_transit_accessibility
      CHECK (accessibility IS NULL OR accessibility <@ ARRAY['wheelchair', 'stroller', 'step_free', 'elevator', 'assistance_available']::TEXT[]),
    CONSTRAINT chk_transit_status
      CHECK (status IN ('draft', 'published', 'archived')),

    -- Durações positivas
    CONSTRAINT chk_transit_durations_positive
      CHECK (
        (duration_min_minutes IS NULL OR duration_min_minutes >= 0) AND
        (duration_avg_minutes IS NULL OR duration_avg_minutes >= 0) AND
        (duration_max_minutes IS NULL OR duration_max_minutes >= 0)
      ),
    -- Progressão de duração
    CONSTRAINT chk_transit_durations_logic
      CHECK (
        (duration_min_minutes IS NULL OR duration_avg_minutes IS NULL OR duration_min_minutes <= duration_avg_minutes) AND
        (duration_avg_minutes IS NULL OR duration_max_minutes IS NULL OR duration_avg_minutes <= duration_max_minutes) AND
        (duration_min_minutes IS NULL OR duration_max_minutes IS NULL OR duration_min_minutes <= duration_max_minutes)
      ),

    -- Preços positivos e progressão
    CONSTRAINT chk_transit_prices_positive
      CHECK (
        (price_min IS NULL OR price_min >= 0) AND
        (price_max IS NULL OR price_max >= 0)
      ),
    CONSTRAINT chk_transit_prices_logic
      CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max),

    -- Frequência e transfers
    CONSTRAINT chk_transit_frequency
      CHECK (frequency_minutes IS NULL OR frequency_minutes > 0),
    CONSTRAINT chk_transit_transfers
      CHECK (transfers_required >= 0),

    -- Origem obrigatória: por experience_id ou por zona não vazia
    CONSTRAINT chk_transit_requires_origin
      CHECK (
        origin_experience_id IS NOT NULL
        OR (origin_zone IS NOT NULL AND trim(origin_zone) <> '')
      ),
    -- Destino obrigatório: por experience_id ou por zona não vazia
    CONSTRAINT chk_transit_requires_destination
      CHECK (
        destination_experience_id IS NOT NULL
        OR (destination_zone IS NOT NULL AND trim(destination_zone) <> '')
      ),

    -- Zonas não podem ser string vazia ou só espaços
    CONSTRAINT chk_transit_zone_origin_not_empty
      CHECK (origin_zone IS NULL OR trim(origin_zone) <> ''),
    CONSTRAINT chk_transit_zone_destination_not_empty
      CHECK (destination_zone IS NULL OR trim(destination_zone) <> ''),

    -- Origem e destino por ID não podem ser a mesma experiência
    CONSTRAINT chk_transit_different_endpoints
      CHECK (
        origin_experience_id IS NULL
        OR destination_experience_id IS NULL
        OR origin_experience_id != destination_experience_id
      ),

    -- Moeda em formato ISO 4217 (3 letras maiúsculas)
    CONSTRAINT chk_transit_currency_format
      CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$')

    -- VALIDAÇÕES DELEGADAS AO REPOSITORY/ADMIN (não implementadas no banco):
    -- - origem e destino iguais por zona textual
    -- - experience_id pertencente a destination_id diferente do da rota
    -- O Admin deve validar coerência editorial antes de persistir.
);

CREATE INDEX IF NOT EXISTS idx_transit_options_destination
  ON public.transit_options(destination_id);
CREATE INDEX IF NOT EXISTS idx_transit_options_origin_exp
  ON public.transit_options(origin_experience_id);
CREATE INDEX IF NOT EXISTS idx_transit_options_dest_exp
  ON public.transit_options(destination_experience_id);

-- Trigger de updated_at (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_transit_options_modtime'
  ) THEN
    CREATE TRIGGER update_transit_options_modtime
        BEFORE UPDATE ON public.transit_options
        FOR EACH ROW
        EXECUTE FUNCTION public.update_modified_column();
  END IF;
END
$$;

-- RLS
ALTER TABLE public.transit_options ENABLE ROW LEVEL SECURITY;

-- Policy de leitura: anon e authenticated só podem ler rotas com status = 'published'.
-- ESCRITA PERMANECE BLOQUEADA POR RLS.
-- A futura interface administrativa só poderá gravar após implementação de autenticação/role
-- administrativa ou backend seguro com service_role. service_role nunca será exposta no frontend.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'transit_options'
      AND policyname = 'public_read_published_transit_options'
  ) THEN
    CREATE POLICY public_read_published_transit_options
      ON public.transit_options
      FOR SELECT
      TO anon, authenticated
      USING (status = 'published');
  END IF;
END
$$;
