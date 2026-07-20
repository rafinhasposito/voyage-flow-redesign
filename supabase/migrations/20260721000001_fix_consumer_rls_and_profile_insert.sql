-- Fix Consumer RLS policies

-- 1. Add insert policy for profiles to support application-level upserts
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Update trips policy to explicitly use WITH CHECK for inserts to ensure RLS compliance
DROP POLICY IF EXISTS "Users can manage own trips" ON public.trips;
CREATE POLICY "Users can manage own trips" ON public.trips
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
