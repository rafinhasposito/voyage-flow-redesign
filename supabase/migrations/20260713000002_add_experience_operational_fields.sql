-- MIGRATION B - EXPERIENCES
-- Adicionar campos logísticos na tabela experiences

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS min_duration_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS ideal_duration_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS max_duration_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS typical_queue_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS booking_deadline_hours INTEGER NULL,
  ADD COLUMN IF NOT EXISTS booking_time_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS meal_periods TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS source_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_experiences_duration_positive' AND conrelid = 'public.experiences'::regclass) THEN
    ALTER TABLE public.experiences ADD CONSTRAINT chk_experiences_duration_positive CHECK (
      (min_duration_minutes IS NULL OR min_duration_minutes >= 0) AND
      (ideal_duration_minutes IS NULL OR ideal_duration_minutes >= 0) AND
      (max_duration_minutes IS NULL OR max_duration_minutes >= 0) AND
      (buffer_before_minutes IS NULL OR buffer_before_minutes >= 0) AND
      (buffer_after_minutes IS NULL OR buffer_after_minutes >= 0) AND
      (typical_queue_minutes IS NULL OR typical_queue_minutes >= 0) AND
      (booking_deadline_hours IS NULL OR booking_deadline_hours >= 0)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_experiences_duration_logic' AND conrelid = 'public.experiences'::regclass) THEN
    ALTER TABLE public.experiences ADD CONSTRAINT chk_experiences_duration_logic CHECK (
      (min_duration_minutes IS NULL OR ideal_duration_minutes IS NULL OR min_duration_minutes <= ideal_duration_minutes) AND
      (ideal_duration_minutes IS NULL OR max_duration_minutes IS NULL OR ideal_duration_minutes <= max_duration_minutes) AND
      (min_duration_minutes IS NULL OR max_duration_minutes IS NULL OR min_duration_minutes <= max_duration_minutes)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_experiences_booking_time_mode' AND conrelid = 'public.experiences'::regclass) THEN
    ALTER TABLE public.experiences ADD CONSTRAINT chk_experiences_booking_time_mode CHECK (
      booking_time_mode IS NULL OR booking_time_mode IN ('open', 'time_window', 'fixed_time', 'scheduled_session', 'walk_in')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_experiences_meal_periods' AND conrelid = 'public.experiences'::regclass) THEN
    ALTER TABLE public.experiences ADD CONSTRAINT chk_experiences_meal_periods CHECK (
      meal_periods IS NULL OR (meal_periods <@ ARRAY['breakfast', 'brunch', 'lunch', 'afternoon_tea', 'snack', 'dinner', 'late_night']::TEXT[])
    );
  END IF;
END
$$;
