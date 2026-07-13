-- Migration: Add intelligence_metadata to experiences table
-- Mantém short_description como texto editorial legado.

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS intelligence_metadata JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_experiences_intelligence_metadata_is_object'
      AND conrelid = 'public.experiences'::regclass
  ) THEN
    ALTER TABLE public.experiences
      ADD CONSTRAINT chk_experiences_intelligence_metadata_is_object
      CHECK (
        intelligence_metadata IS NULL
        OR jsonb_typeof(intelligence_metadata) = 'object'
      );
  END IF;
END
$$;

COMMENT ON COLUMN public.experiences.intelligence_metadata IS
  'Armazena metadados estruturados de inteligência. short_description permanece reservado ao texto editorial legado.';
