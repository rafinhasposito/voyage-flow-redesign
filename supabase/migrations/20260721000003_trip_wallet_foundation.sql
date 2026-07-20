-- Migration: 20260721000003_trip_wallet_foundation.sql
-- Descrição: Fundação B2C do Wallet-First (Reservations, Documents) e Storage RLS.

-- 1. Trip Reservations
CREATE TABLE IF NOT EXISTS public.trip_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT,
    provider TEXT,
    purchase_status TEXT NOT NULL DEFAULT 'undecided', -- booked, wanted, undecided, not_applicable, cancelled
    confirmation_code TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    location_name TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_fixed BOOLEAN NOT NULL DEFAULT true,
    price NUMERIC,
    currency TEXT,
    structured_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.trip_reservations ENABLE ROW LEVEL SECURITY;

-- RLS: Acesso apenas se o usuário for proprietário da viagem vinculada
CREATE POLICY "Users can view own trip reservations"
ON public.trip_reservations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_reservations.trip_id
      AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own trip reservations"
ON public.trip_reservations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_reservations.trip_id
      AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own trip reservations"
ON public.trip_reservations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_reservations.trip_id
      AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own trip reservations"
ON public.trip_reservations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_reservations.trip_id
      AND trips.user_id = auth.uid()
  )
);

-- 2. Trip Documents
CREATE TABLE IF NOT EXISTS public.trip_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.trip_reservations(id) ON DELETE SET NULL,
    document_type TEXT,
    file_name TEXT,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    parsed_data JSONB,
    parse_status TEXT DEFAULT 'pending', -- pending, confirmed, failed
    offline_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

-- RLS para Documents
CREATE POLICY "Users can view own trip documents"
ON public.trip_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_documents.trip_id
      AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own trip documents"
ON public.trip_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_documents.trip_id
      AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own trip documents"
ON public.trip_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_documents.trip_id
      AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own trip documents"
ON public.trip_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_documents.trip_id
      AND trips.user_id = auth.uid()
  )
);

-- 3. Storage Bucket: trip-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trip-documents', 
    'trip-documents', 
    false, 
    10485760, -- 10MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'message/rfc822']
) ON CONFLICT (id) DO UPDATE 
SET public = false;

-- Storage Policies
-- A política verifica se o auth.uid() corresponde ao prefixo raiz do storage_path 
-- e.g. "auth.uid()/trip_id/arquivo"
CREATE POLICY "Users can upload their own trip documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own trip documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own trip documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_documents TO authenticated;
