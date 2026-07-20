-- Migration: TRIP-READY V1 (Foundation)
-- Descrição: Estrutura B2C mínima para persistência de Viagens do usuário.

-- 1. Tabela de Perfis de Viajantes (B2C)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active',
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de Viagens (Trips)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hotel_name TEXT,
    hotel_lat DOUBLE PRECISION,
    hotel_lng DOUBLE PRECISION,
    companionship TEXT,
    pace TEXT,
    budget_level TEXT,
    status TEXT NOT NULL DEFAULT 'planning', -- planning, active, completed, archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de Dias do Roteiro (Itinerary Days)
CREATE TABLE IF NOT EXISTS public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, day_number)
);
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de Atividades do Roteiro (Trip Experiences)
CREATE TABLE IF NOT EXISTS public.trip_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE RESTRICT,
    order_index INTEGER NOT NULL,
    start_time TIME,
    end_time TIME,
    is_fixed_appointment BOOLEAN DEFAULT false,
    reservation_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.trip_experiences ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES (RLS)
-- ==========================================

-- Profiles: O próprio usuário pode ler e atualizar seu perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trips: O proprietário gerencia suas viagens
CREATE POLICY "Users can manage own trips" ON public.trips
    FOR ALL USING (auth.uid() = user_id);

-- Itinerary Days: Acesso baseado na propriedade da viagem
CREATE POLICY "Users can manage own itinerary days" ON public.itinerary_days
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_days.trip_id AND trips.user_id = auth.uid())
    );

-- Trip Experiences: Acesso baseado na propriedade da viagem pai do dia
CREATE POLICY "Users can manage own trip experiences" ON public.trip_experiences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.itinerary_days
            JOIN public.trips ON trips.id = itinerary_days.trip_id
            WHERE itinerary_days.id = trip_experiences.day_id AND trips.user_id = auth.uid()
        )
    );

-- Functions para updated_at automático
CREATE OR REPLACE FUNCTION update_trip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_timestamp
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION update_trip_updated_at();
