BEGIN;

-- ROLLBACK DE EMERGÊNCIA: restaura configuração insegura anterior. 
-- Usar somente para recuperação temporária.

-- 1. REMOVER POLICIES SEGURAS CRIADAS NO HOTFIX
DROP POLICY IF EXISTS "destinations_read_public" ON public.destinations;
DROP POLICY IF EXISTS "destinations_read_admin" ON public.destinations;
DROP POLICY IF EXISTS "destinations_insert_admin" ON public.destinations;
DROP POLICY IF EXISTS "destinations_update_admin" ON public.destinations;

DROP POLICY IF EXISTS "experiences_read_public" ON public.experiences;
DROP POLICY IF EXISTS "experiences_read_admin" ON public.experiences;
DROP POLICY IF EXISTS "experiences_insert_admin" ON public.experiences;
DROP POLICY IF EXISTS "experiences_update_admin" ON public.experiences;

-- 2. REVOGAR OS GRANTS SEGUROS
REVOKE ALL PRIVILEGES ON TABLE public.destinations FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.experiences FROM anon, authenticated;

-- 3. RESTAURAR OS GRANTS ANTIGOS (INSEGUROS)
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.destinations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.experiences TO anon, authenticated;

-- 4. RESTAURAR AS 8 POLICIES INSEGURAS
-- Destinations
CREATE POLICY "Allow anonymous DELETE destinations" ON public.destinations FOR DELETE USING (true);
CREATE POLICY "Allow anonymous INSERT destinations" ON public.destinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous SELECT destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous UPDATE destinations" ON public.destinations FOR UPDATE USING (true) WITH CHECK (true);

-- Experiences
CREATE POLICY "Allow anonymous DELETE experiences" ON public.experiences FOR DELETE USING (true);
CREATE POLICY "Allow anonymous INSERT experiences" ON public.experiences FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous SELECT experiences" ON public.experiences FOR SELECT USING (true);
CREATE POLICY "Allow anonymous UPDATE experiences" ON public.experiences FOR UPDATE USING (true) WITH CHECK (true);

-- 5. RESTAURAR EXECUTE DE PUBLIC.IS_ADMIN() PARA ANON
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

COMMIT;
