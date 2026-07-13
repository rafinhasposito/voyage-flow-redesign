-- MIGRATION C - OPERATING_HOURS
-- Cria a tabela base para os horários de funcionamento.

-- VERIFICAÇÃO OBRIGATÓRIA: a função update_modified_column deve existir antes dos triggers.
-- Ela é criada pelo schema.sql base. Se não existir, esta migration falha intencionalmente.
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

CREATE TABLE IF NOT EXISTS public.operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ON DELETE CASCADE: horários não existem sem a experiência vinculada.
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    period_type TEXT NOT NULL,
    opens_at TIME NULL,
    closes_at TIME NULL,
    last_entry_at TIME NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    is_24_hours BOOLEAN NOT NULL DEFAULT false,
    spans_next_day BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    valid_from DATE NULL,
    valid_to DATE NULL,
    source_url TEXT NULL,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Domínio básico
    CONSTRAINT chk_operating_hours_day_of_week
      CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_operating_hours_period_type
      CHECK (period_type IN ('general', 'kitchen', 'service')),
    CONSTRAINT chk_operating_hours_sort_order
      CHECK (sort_order >= 0),
    CONSTRAINT chk_operating_hours_validity
      CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to),

    -- is_closed e is_24_hours não podem coexistir
    CONSTRAINT chk_operating_hours_is_closed_is_24_hours
      CHECK (NOT (is_closed = true AND is_24_hours = true)),

    -- Registro FECHADO: nenhum horário, sem last_entry_at, sem spans_next_day
    CONSTRAINT chk_operating_hours_closed_no_times
      CHECK (
        (is_closed = false)
        OR (opens_at IS NULL AND closes_at IS NULL AND last_entry_at IS NULL AND spans_next_day = false)
      ),

    -- Registro 24H: sem opens_at, closes_at, last_entry_at, sem spans_next_day
    CONSTRAINT chk_operating_hours_24_no_times
      CHECK (
        (is_24_hours = false)
        OR (opens_at IS NULL AND closes_at IS NULL AND last_entry_at IS NULL AND spans_next_day = false)
      ),

    -- Registro NORMAL (não fechado, não 24h): exige opens_at e closes_at
    CONSTRAINT chk_operating_hours_normal_requires_times
      CHECK (
        (is_closed = true OR is_24_hours = true)
        OR (opens_at IS NOT NULL AND closes_at IS NOT NULL)
      ),

    -- last_entry_at não pode existir em registro fechado
    CONSTRAINT chk_operating_hours_last_entry_not_closed
      CHECK (last_entry_at IS NULL OR is_closed = false),

    -- spans_next_day só é válido em registro com horários abertos
    CONSTRAINT chk_operating_hours_spans_next_day
      CHECK (
        (spans_next_day = false)
        OR (is_closed = false AND is_24_hours = false AND opens_at IS NOT NULL AND closes_at IS NOT NULL)
      )

    -- VALIDAÇÕES DELEGADAS AO REPOSITORY/ADMIN (não implementadas no banco):
    -- - last_entry_at posterior a closes_at (ambíguo quando spans_next_day = true)
    -- - last_entry_at incompatível com spans_next_day
    -- - opens_at igual a closes_at
    -- - dois registros fechados duplicados no mesmo dia
    -- - dois intervalos sobrepostos no mesmo dia/period_type
    -- - coerência entre last_entry_at e spans_next_day
    -- O Repository deve validar antes de persistir; a Engine apenas consome dados consistentes.
);

CREATE INDEX IF NOT EXISTS idx_operating_hours_experience_id
  ON public.operating_hours(experience_id);
CREATE INDEX IF NOT EXISTS idx_operating_hours_experience_day
  ON public.operating_hours(experience_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_operating_hours_validity
  ON public.operating_hours(valid_from, valid_to);

-- Trigger de updated_at (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_operating_hours_modtime'
  ) THEN
    CREATE TRIGGER update_operating_hours_modtime
        BEFORE UPDATE ON public.operating_hours
        FOR EACH ROW
        EXECUTE FUNCTION public.update_modified_column();
  END IF;
END
$$;

-- RLS
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

-- Policy de leitura: anon e authenticated só podem ler horários de experiências publicadas.
-- ESCRITA PERMANECE BLOQUEADA POR RLS.
-- A futura interface administrativa só poderá gravar após implementação de autenticação/role
-- administrativa ou backend seguro com service_role. service_role nunca será exposta no frontend.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'operating_hours'
      AND policyname = 'public_read_published_operating_hours'
  ) THEN
    CREATE POLICY public_read_published_operating_hours
      ON public.operating_hours
      FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.experiences
          WHERE experiences.id = operating_hours.experience_id
            AND experiences.status = 'published'
        )
      );
  END IF;
END
$$;
