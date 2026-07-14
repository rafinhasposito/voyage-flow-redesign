BEGIN;

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Remover policies inseguras anteriores
DROP POLICY IF EXISTS "Allow anonymous DELETE destinations"
  ON public.destinations;
DROP POLICY IF EXISTS "Allow anonymous INSERT destinations"
  ON public.destinations;
DROP POLICY IF EXISTS "Allow anonymous SELECT destinations"
  ON public.destinations;
DROP POLICY IF EXISTS "Allow anonymous UPDATE destinations"
  ON public.destinations;

DROP POLICY IF EXISTS "Allow anonymous DELETE experiences"
  ON public.experiences;
DROP POLICY IF EXISTS "Allow anonymous INSERT experiences"
  ON public.experiences;
DROP POLICY IF EXISTS "Allow anonymous SELECT experiences"
  ON public.experiences;
DROP POLICY IF EXISTS "Allow anonymous UPDATE experiences"
  ON public.experiences;

-- Permitir execução de forma idempotente
DROP POLICY IF EXISTS "destinations_read_public"
  ON public.destinations;
DROP POLICY IF EXISTS "destinations_read_admin"
  ON public.destinations;
DROP POLICY IF EXISTS "destinations_insert_admin"
  ON public.destinations;
DROP POLICY IF EXISTS "destinations_update_admin"
  ON public.destinations;
DROP POLICY IF EXISTS "destinations_delete_admin"
  ON public.destinations;

DROP POLICY IF EXISTS "experiences_read_public"
  ON public.experiences;
DROP POLICY IF EXISTS "experiences_read_admin"
  ON public.experiences;
DROP POLICY IF EXISTS "experiences_insert_admin"
  ON public.experiences;
DROP POLICY IF EXISTS "experiences_update_admin"
  ON public.experiences;
DROP POLICY IF EXISTS "experiences_delete_admin"
  ON public.experiences;

-- Remover privilégios amplos
REVOKE ALL PRIVILEGES
  ON TABLE public.destinations
  FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES
  ON TABLE public.experiences
  FROM PUBLIC, anon, authenticated;

-- Leitura pública e autenticada
GRANT SELECT
  ON TABLE public.destinations
  TO anon, authenticated;

GRANT SELECT
  ON TABLE public.experiences
  TO anon, authenticated;

-- Escrita sem exclusão definitiva
GRANT INSERT, UPDATE
  ON TABLE public.destinations
  TO authenticated;

GRANT INSERT, UPDATE
  ON TABLE public.experiences
  TO authenticated;

-- is_admin não precisa ser executada por visitantes anônimos
REVOKE EXECUTE
  ON FUNCTION public.is_admin()
  FROM PUBLIC, anon;

GRANT EXECUTE
  ON FUNCTION public.is_admin()
  TO authenticated;

-- Leitura pública: somente conteúdo visível
CREATE POLICY "destinations_read_public"
  ON public.destinations
  FOR SELECT
  TO anon, authenticated
  USING (is_active IS TRUE);

CREATE POLICY "experiences_read_public"
  ON public.experiences
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Administrador pode visualizar todos os registros
CREATE POLICY "destinations_read_admin"
  ON public.destinations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "experiences_read_admin"
  ON public.experiences
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Escrita somente para administrador ativo
CREATE POLICY "destinations_insert_admin"
  ON public.destinations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "destinations_update_admin"
  ON public.destinations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "experiences_insert_admin"
  ON public.experiences
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "experiences_update_admin"
  ON public.experiences
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
