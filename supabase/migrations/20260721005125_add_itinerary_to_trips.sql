-- Migration: 20260721005125_add_itinerary_to_trips.sql
-- Descrição: Adiciona coluna oficial itinerary em public.trips para armazenar o roteiro gerado como fonte canônica.

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS itinerary JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Garantir que itinerary seja sempre um array json
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'trips_itinerary_is_array'
    ) THEN
        ALTER TABLE public.trips
        ADD CONSTRAINT trips_itinerary_is_array CHECK (jsonb_typeof(itinerary) = 'array');
    END IF;
END $$;
