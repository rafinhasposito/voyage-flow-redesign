-- MIGRATION A - DESTINATIONS
-- Adicionar country_code (ISO 3166-1 alpha-2)

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS country_code TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_destinations_country_code_format'
      AND conrelid = 'public.destinations'::regclass
  ) THEN
    ALTER TABLE public.destinations
      ADD CONSTRAINT chk_destinations_country_code_format
      CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$');
  END IF;
END
$$;
