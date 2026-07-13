-- =============================================================================
-- MIGRATION 006 — IDENTIDADE ADMINISTRATIVA (S1A)
-- Arquivo: 20260713000006_create_admin_identity.sql
-- Contrato de referência: ADMIN_SECURITY_PLAN.md v1.1
-- Commit de origem: 1746be8 docs(security): establish admin security plan
-- =============================================================================
--
-- ESCOPO DESTA MIGRATION:
--   1. Tabela public.admin_users com nomes explícitos nas constraints
--   2. Validação estrutural rigorosa
--   3. RLS da public.admin_users (sem policies públicas)
--   4. Função public.is_admin()
--   5. Revogação e concessão mínima de EXECUTE na função
--
-- FORA DO ESCOPO DESTA MIGRATION:
--   - Inserção de qualquer usuário administrador (feita manualmente pelo Dashboard)
--   - Policies nas tabelas do catálogo (experiences, destinations, etc.)
--   - Criação de qualquer usuário no Supabase Auth
--   - Qualquer credencial, UUID de usuário real ou e-mail
--
-- AUDITORIA PRÉ-APLICAÇÃO (read-only):
--   -- 1. Verificar se a tabela já existe:
--   SELECT EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'admin_users'
--   );
--
-- AUDITORIA PÓS-APLICAÇÃO (read-only):
--   Após aplicar, confirmar se a função tem o owner correto (postgres/superuser)
--   e propriedades de segurança esperadas, além dos grants e RLS da tabela:
--
--   -- 1. Verificar owner, SECURITY DEFINER e search_path da função:
--   SELECT p.proname,
--          pg_catalog.pg_get_userbyid(p.proowner) AS owner,
--          p.prosecdef AS is_security_definer,
--          p.proconfig AS config
--   FROM pg_proc p
--   JOIN pg_namespace n ON p.pronamespace = n.oid
--   WHERE n.nspname = 'public' AND p.proname = 'is_admin';
--
--   -- 2. Verificar grants de EXECUTE sobre a função (PUBLIC revogado, authenticated concedido):
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public' AND routine_name = 'is_admin';
--
--   -- 3. Verificar se RLS está habilitado na tabela:
--   SELECT relname, relrowsecurity, relforcerowsecurity
--   FROM pg_class
--   JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
--   WHERE pg_namespace.nspname = 'public' AND pg_class.relname = 'admin_users';
--
--   -- 4. Verificar ausência de policies públicas conflitantes:
--   SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'admin_users';
--
--   -- 5. Verificar ausência de grants diretos para anon/PUBLIC:
--   SELECT grantee, privilege_type, is_grantable
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name = 'admin_users';
-- =============================================================================

-- =============================================================================
-- PARTE 1 — TABELA public.admin_users
-- =============================================================================
--
-- Propósito: registrar quais usuários autenticados do Supabase Auth possuem
-- o papel administrativo no MVP do Voyage Flow.
--
-- DECISÕES DE DESIGN:
--   - A presença ativa nesta tabela (is_active = true) é a única fonte de
--     verdade sobre o papel de admin no MVP.
--   - Não duplicamos e-mail, senha ou qualquer credencial de auth.users.
--   - Não armazenamos role enviada pelo frontend.
--   - created_by permite rastrear quem promoveu o administrador futuramente.
--     No bootstrap, created_by será NULL (inserção manual pelo Dashboard).
--   - ON DELETE CASCADE em user_id: se o usuário for removido do Auth,
--     seu registro de admin é automaticamente removido, evitando entradas
--     fantasma que poderiam conceder acesso a usuários recriados.
--   - ON DELETE SET NULL em created_by: se o admin criador for removido,
--     o registro do promovido permanece válido — apenas a rastreabilidade
--     do criador é perdida.
--
-- BOOTSTRAP — PRIMEIRO ADMINISTRADOR:
--   O primeiro administrador NÃO será inserido por esta migration.
--   Após criar o usuário pelo painel Supabase (Authentication > Users),
--   o administrador do projeto deve executar manualmente no SQL Editor:
--
--     INSERT INTO public.admin_users (user_id, notes)
--     VALUES ('<uuid-do-usuario-criado-no-dashboard>', 'Primeiro administrador');
--
--   Nenhum UUID, e-mail ou credencial deve ser incluído neste arquivo de migration.

CREATE TABLE IF NOT EXISTS public.admin_users (
  -- Chave primária: o próprio UUID do usuário no Supabase Auth.
  user_id    UUID NOT NULL,

  -- Auditoria de criação.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Rastreabilidade: quem promoveu este administrador.
  -- NULL no bootstrap inicial (inserção manual pelo Dashboard).
  created_by UUID NULL,

  -- Flag de ativação: somente is_active = true concede acesso administrativo.
  -- Permite suspender um admin sem removê-lo da tabela.
  is_active  BOOLEAN NOT NULL DEFAULT true,

  -- Campo livre para anotações operacionais (não afeta permissões).
  notes      TEXT NULL,

  CONSTRAINT pk_admin_users PRIMARY KEY (user_id),
  CONSTRAINT fk_admin_users_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_admin_users_created_by
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL
);

-- =============================================================================
-- PARTE 2 — VALIDAÇÃO ESTRUTURAL (Idempotência Segura)
-- =============================================================================
--
-- O bloco abaixo verifica se a estrutura resultante da tabela atende ao contrato
-- exigido. Isso evita que CREATE TABLE IF NOT EXISTS oculte divergências em um
-- banco onde a tabela já existia incorretamente. Falha rápido (RAISE EXCEPTION).
--
-- Nota sobre Foreign Keys: validamos a semântica (ON DELETE, colunas), e não o nome
-- exato, para que migrations compensatórias em instalações antigas não precisem
-- falhar puramente por divergência de nomenclatura. Nomes explícitos (fk_admin_users_*)
-- são aplicados para novas instalações.

DO $$
DECLARE
  v_col_type text;
  v_is_nullable text;
  v_default text;
  v_pk_cols text;
  v_fk_user_id_confdeltype text;
  v_fk_created_by_confdeltype text;
BEGIN
  -- 1. Validar Colunas
  -- user_id
  SELECT data_type, is_nullable INTO v_col_type, v_is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'user_id';
  IF v_col_type IS NULL THEN RAISE EXCEPTION 'Coluna user_id não existe.'; END IF;
  IF v_col_type != 'uuid' THEN RAISE EXCEPTION 'Coluna user_id deve ser UUID (atual: %)', v_col_type; END IF;
  IF v_is_nullable != 'NO' THEN RAISE EXCEPTION 'Coluna user_id deve ser NOT NULL.'; END IF;

  -- created_at
  SELECT data_type, is_nullable, column_default INTO v_col_type, v_is_nullable, v_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'created_at';
  IF v_col_type IS NULL THEN RAISE EXCEPTION 'Coluna created_at não existe.'; END IF;
  IF v_col_type != 'timestamp with time zone' THEN RAISE EXCEPTION 'Coluna created_at deve ser TIMESTAMPTZ (atual: %)', v_col_type; END IF;
  IF v_is_nullable != 'NO' THEN RAISE EXCEPTION 'Coluna created_at deve ser NOT NULL.'; END IF;
  IF v_default IS NULL OR v_default NOT ILIKE '%now()%' THEN RAISE EXCEPTION 'Coluna created_at deve ter default compatível com now().'; END IF;

  -- created_by
  SELECT data_type, is_nullable INTO v_col_type, v_is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'created_by';
  IF v_col_type IS NULL THEN RAISE EXCEPTION 'Coluna created_by não existe.'; END IF;
  IF v_col_type != 'uuid' THEN RAISE EXCEPTION 'Coluna created_by deve ser UUID (atual: %)', v_col_type; END IF;
  IF v_is_nullable != 'YES' THEN RAISE EXCEPTION 'Coluna created_by deve ser nullable.'; END IF;

  -- is_active
  SELECT data_type, is_nullable, column_default INTO v_col_type, v_is_nullable, v_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active';
  IF v_col_type IS NULL THEN RAISE EXCEPTION 'Coluna is_active não existe.'; END IF;
  IF v_col_type != 'boolean' THEN RAISE EXCEPTION 'Coluna is_active deve ser BOOLEAN (atual: %)', v_col_type; END IF;
  IF v_is_nullable != 'NO' THEN RAISE EXCEPTION 'Coluna is_active deve ser NOT NULL.'; END IF;
  IF v_default IS NULL OR v_default NOT ILIKE '%true%' THEN RAISE EXCEPTION 'Coluna is_active deve ter default true.'; END IF;

  -- notes
  SELECT data_type, is_nullable INTO v_col_type, v_is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'notes';
  IF v_col_type IS NULL THEN RAISE EXCEPTION 'Coluna notes não existe.'; END IF;
  IF v_col_type != 'text' THEN RAISE EXCEPTION 'Coluna notes deve ser TEXT (atual: %)', v_col_type; END IF;
  IF v_is_nullable != 'YES' THEN RAISE EXCEPTION 'Coluna notes deve ser nullable.'; END IF;

  -- 2. Validar Primary Key (somente user_id)
  SELECT string_agg(a.attname, ',') INTO v_pk_cols
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = 'public.admin_users'::regclass AND i.indisprimary;
  IF v_pk_cols IS NULL THEN RAISE EXCEPTION 'Primary key não existe na tabela admin_users.'; END IF;
  IF v_pk_cols != 'user_id' THEN RAISE EXCEPTION 'Primary key deve conter somente user_id (encontrado: %)', v_pk_cols; END IF;

  -- 3. Validar Foreign Keys (semântica)
  -- user_id -> auth.users(id) ON DELETE CASCADE
  SELECT c.confdeltype INTO v_fk_user_id_confdeltype
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.admin_users'::regclass
    AND c.contype = 'f'
    AND a.attname = 'user_id'
    AND c.confrelid = 'auth.users'::regclass;
  IF v_fk_user_id_confdeltype IS NULL THEN RAISE EXCEPTION 'FK de user_id para auth.users não encontrada.'; END IF;
  IF v_fk_user_id_confdeltype != 'c' THEN RAISE EXCEPTION 'FK de user_id deve ter ON DELETE CASCADE (atual: %)', v_fk_user_id_confdeltype; END IF;

  -- created_by -> auth.users(id) ON DELETE SET NULL
  SELECT c.confdeltype INTO v_fk_created_by_confdeltype
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.admin_users'::regclass
    AND c.contype = 'f'
    AND a.attname = 'created_by'
    AND c.confrelid = 'auth.users'::regclass;
  IF v_fk_created_by_confdeltype IS NULL THEN RAISE EXCEPTION 'FK de created_by para auth.users não encontrada.'; END IF;
  IF v_fk_created_by_confdeltype != 'n' THEN RAISE EXCEPTION 'FK de created_by deve ter ON DELETE SET NULL (atual: %)', v_fk_created_by_confdeltype; END IF;

END
$$;

-- =============================================================================
-- PARTE 3 — COMENTÁRIOS DAS COLUNAS
-- =============================================================================

COMMENT ON COLUMN public.admin_users.user_id    IS 'UUID do usuário em auth.users. Referência com CASCADE.';
COMMENT ON COLUMN public.admin_users.created_at IS 'Timestamp de quando o registro foi criado.';
COMMENT ON COLUMN public.admin_users.created_by IS 'UUID do admin que promoveu este usuário. NULL no bootstrap.';
COMMENT ON COLUMN public.admin_users.is_active  IS 'Somente TRUE concede privilégios administrativos via is_admin().';
COMMENT ON COLUMN public.admin_users.notes      IS 'Campo livre para anotações operacionais. Não afeta permissões.';


-- =============================================================================
-- PARTE 4 — RLS DA TABELA public.admin_users
-- =============================================================================
--
-- A tabela é protegida por Row Level Security sem nenhuma policy pública.
--
-- CONSEQUÊNCIA INTENCIONAL:
--   Com RLS habilitado e sem nenhuma policy criada, o PostgreSQL aplica
--   a regra padrão: todas as operações (SELECT, INSERT, UPDATE, DELETE)
--   são bloqueadas para qualquer role que não seja o owner da tabela ou
--   uma role com privilégio BYPASSRLS (como o superuser do Supabase).
--
-- POR QUE NÃO HÁ POLICIES?
--   - Anon não pode ler admin_users (nem saber quem é admin).
--   - Authenticated comum não pode se auto-inserir como admin.
--   - A própria função is_admin() usa SECURITY DEFINER, operando com
--     privilégios do owner da função, que bypassa o RLS desta tabela.
--   - Toda administração desta tabela ocorre pelo SQL Editor do Supabase
--     (operando como superuser/postgres, que ignora RLS) ou por migrations
--     futuras explicitamente aprovadas.

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.admin_users IS
  'Registra os usuários com papel administrativo no Voyage Flow MVP. '
  'A presença ativa nesta tabela (is_active = true) é a única fonte de verdade '
  'sobre o papel de admin. Nenhuma credencial, senha ou e-mail é armazenado aqui. '
  'O primeiro administrador deve ser inserido manualmente via Supabase SQL Editor '
  'após criação do usuário em auth.users pelo painel de Authentication. '
  'RLS HABILITADO SEM POLICIES: toda operação via API (anon/authenticated) é '
  'bloqueada por padrão. Administração somente pelo SQL Editor (superuser).';


-- =============================================================================
-- PARTE 5 — FUNÇÃO public.is_admin()
-- =============================================================================
--
-- Propósito: fornecer às policies RLS do catálogo um predicado booleano
-- seguro para verificar se o usuário autenticado atual é administrador.
--
-- CONTRATO DE SEGURANÇA — LEIA ANTES DE ALTERAR:
--
--   1. SECURITY DEFINER:
--      A função executa com os privilégios do seu owner (superuser), não do
--      usuário chamador. Isso é NECESSÁRIO porque:
--      - A tabela admin_users tem RLS habilitado sem policies públicas.
--      - Se a função fosse SECURITY INVOKER, o usuário autenticado tentaria
--        ler admin_users diretamente, mas o RLS bloquearia esse SELECT —
--        criando uma recursão impossível de resolver (preciso ser admin para
--        ler admin_users, mas preciso ler admin_users para saber se sou admin).
--      - SECURITY DEFINER quebra essa recursão: a função lê admin_users como
--        superuser e retorna apenas um booleano opaco para a policy.
--
--   2. SET search_path = '':
--      Obrigatório em todas as funções SECURITY DEFINER.
--      Sem isso, um atacante poderia criar objetos em schemas não qualificados
--      para fazer a função executar código malicioso com privilégios elevados.
--      Com search_path vazio, TODOS os objetos devem ser referenciados com
--      schema explícito (ex: public.admin_users, auth.uid()).
--
--   3. LANGUAGE sql + STABLE:
--      - sql: mais eficiente que plpgsql para queries simples; sem overhead
--        de interpretação de procedimento.
--      - STABLE: indica ao PostgreSQL que o resultado é consistente dentro
--        da mesma transação (para o mesmo auth.uid()). Permite otimizações
--        de cache. VOLATILE seria incorreto (implicaria efeitos colaterais).
--
--   4. Sem parâmetros:
--      A função não aceita user_id, role ou qualquer argumento externo.
--      Isso impede que o frontend forge ou injete identidade.
--      A única fonte de identidade é auth.uid() — gerado pelo JWT validado
--      pelo Supabase, não controlável pelo cliente.
--
--   5. Não consulta user_metadata nem app_metadata:
--      user_metadata pode ser editado pelo próprio usuário em certos fluxos.
--      app_metadata requereria uso de service_role para escrita segura.
--      A fonte de verdade é exclusivamente a tabela public.admin_users.
--
--   6. Retorna somente boolean:
--      Nunca expõe registros de admin_users. A policy recebe apenas true/false.
--      Um atacante não consegue listar admins via esta função.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE public.admin_users.user_id = auth.uid()
      AND public.admin_users.is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Verifica se o usuário autenticado atual possui o papel administrativo. '
  'Retorna TRUE somente se auth.uid() estiver em public.admin_users com is_active = true. '
  'SECURITY DEFINER com search_path vazio: necessário para bypassar o RLS de admin_users '
  'sem criar recursão. Não aceita parâmetros externos. Não consulta user_metadata. '
  'Usar em policies RLS como: USING (public.is_admin()) TO authenticated.';


-- =============================================================================
-- PARTE 6 — GRANTS MÍNIMOS DA FUNÇÃO
-- =============================================================================
--
-- Por padrão, o PostgreSQL concede EXECUTE em funções para PUBLIC (todas as roles).
-- Isso é inaceitável para uma função SECURITY DEFINER que acessa dados sensíveis.
--
-- ESTRATÉGIA:
--   1. Revogar EXECUTE de PUBLIC (inclui anon e authenticated).
--   2. Conceder EXECUTE somente a authenticated.
--
-- POR QUE authenticated E NÃO anon?
--   - is_admin() será usada nas policies de ESCRITA (INSERT/UPDATE), que
--     serão criadas com a cláusula "TO authenticated".
--   - Usuários anônimos nunca deverão executar operações de escrita no catálogo.
--   - Não conceder EXECUTE a anon evita que a função seja chamada
--     diretamente via RPC por qualquer visitante não autenticado.

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================================
-- FIM DA MIGRATION 006
-- =============================================================================
