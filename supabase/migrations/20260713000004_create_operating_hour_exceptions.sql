-- MIGRATION D - OPERATING_HOUR_EXCEPTIONS
-- Cria a tabela de exceções aos horários padrões (fechamentos, feriados, etc.)

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

CREATE TABLE IF NOT EXISTS public.operating_hour_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ON DELETE CASCADE: exceções não existem sem a experiência vinculada.
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'general',
    opens_at TIME NULL,
    closes_at TIME NULL,
    last_entry_at TIME NULL,
    is_24_hours BOOLEAN NOT NULL DEFAULT false,
    spans_next_day BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    reason TEXT NULL,
    source_url TEXT NULL,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Domínio básico
    CONSTRAINT chk_exceptions_status
      CHECK (status IN ('closed', 'modified_hours', 'special_opening')),
    CONSTRAINT chk_exceptions_period_type
      CHECK (period_type IN ('general', 'kitchen', 'service')),
    CONSTRAINT chk_exceptions_dates
      CHECK (start_date <= end_date),
    CONSTRAINT chk_exceptions_sort_order
      CHECK (sort_order >= 0),

    -- FECHADO: sem horários, sem last_entry_at, is_24_hours = false, spans_next_day = false
    CONSTRAINT chk_exceptions_closed_no_times
      CHECK (
        (status != 'closed')
        OR (
          opens_at IS NULL
          AND closes_at IS NULL
          AND last_entry_at IS NULL
          AND is_24_hours = false
          AND spans_next_day = false
        )
      ),

    -- is_24_hours = true: sem horários, sem last_entry_at, spans_next_day = false
    CONSTRAINT chk_exceptions_24_hours
      CHECK (
        (is_24_hours = false)
        OR (
          opens_at IS NULL
          AND closes_at IS NULL
          AND last_entry_at IS NULL
          AND spans_next_day = false
        )
      ),

    -- spans_next_day = true: status não pode ser closed, is_24_hours = false, exige horários
    CONSTRAINT chk_exceptions_spans_next_day
      CHECK (
        (spans_next_day = false)
        OR (
          status != 'closed'
          AND is_24_hours = false
          AND opens_at IS NOT NULL
          AND closes_at IS NOT NULL
        )
      ),

    -- modified_hours e special_opening: exigem horários ou is_24_hours
    CONSTRAINT chk_exceptions_modified_requires_times
      CHECK (
        (status = 'closed')
        OR (is_24_hours = true)
        OR (opens_at IS NOT NULL AND closes_at IS NOT NULL)
      ),

    -- last_entry_at só pode existir quando há funcionamento
    CONSTRAINT chk_exceptions_last_entry
      CHECK (last_entry_at IS NULL OR status != 'closed')

    -- VALIDAÇÕES DELEGADAS AO REPOSITORY/ADMIN (não implementadas no banco):
    -- - conflitos e sobreposições entre duas ou mais exceções para a mesma experiência
    --   (ex: dois registros com start_date/end_date sobrepostos)
    -- - coerência de last_entry_at em relação a closes_at
    -- O Admin deve bloquear conflitos antes de persistir; a Engine apenas consome dados consistentes.
);

-- NOTA: Conflitos complexos entre exceções serão validados pelo Repository/Admin.
-- Esta migration impede apenas combinações estruturalmente impossíveis. Não impede
-- a existência de duas exceções sobrepostas, deixando esse controle de estado lógico
-- para a camada de aplicação/Admin, onde os blocos temporais serão resolvidos antes de persistir.

CREATE INDEX IF NOT EXISTS idx_exceptions_experience_id
  ON public.operating_hour_exceptions(experience_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_dates
  ON public.operating_hour_exceptions(experience_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_exceptions_status
  ON public.operating_hour_exceptions(status);

-- Trigger de updated_at (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_operating_hour_exceptions_modtime'
  ) THEN
    CREATE TRIGGER update_operating_hour_exceptions_modtime
        BEFORE UPDATE ON public.operating_hour_exceptions
        FOR EACH ROW
        EXECUTE FUNCTION public.update_modified_column();
  END IF;
END
$$;

-- RLS
ALTER TABLE public.operating_hour_exceptions ENABLE ROW LEVEL SECURITY;

-- Policy de leitura: anon e authenticated só podem ler exceções de experiências publicadas.
-- ESCRITA PERMANECE BLOQUEADA POR RLS.
-- A futura interface administrativa só poderá gravar após implementação de autenticação/role
-- administrativa ou backend seguro com service_role. service_role nunca será exposta no frontend.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'operating_hour_exceptions'
      AND policyname = 'public_read_published_operating_hour_exceptions'
  ) THEN
    CREATE POLICY public_read_published_operating_hour_exceptions
      ON public.operating_hour_exceptions
      FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.experiences
          WHERE experiences.id = operating_hour_exceptions.experience_id
            AND experiences.status = 'published'
        )
      );
  END IF;
END
$$;
