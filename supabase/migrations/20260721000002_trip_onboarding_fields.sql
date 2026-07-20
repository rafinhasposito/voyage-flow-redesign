-- Migration: 20260721000002_trip_onboarding_fields.sql
-- Descrição: Adiciona JSONB fields de preferências e compromissos fixos no Trips.

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS fixed_commitments JSONB NOT NULL DEFAULT '[]'::jsonb;
