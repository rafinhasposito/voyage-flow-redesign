-- =============================================================================
-- AUDITORIA READ-ONLY DO SCHEMA REMOTO — VERSÃO REVISADA
-- Somente SELECTs. Nenhum dado ou configuração será alterado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. COLUNAS REAIS
-- -----------------------------------------------------------------------------
SELECT
    table_schema AS schema_name,
    table_name AS tabela,
    column_name AS coluna,
    data_type,
    udt_name,
    is_nullable AS nullable,
    column_default AS column_default_value,
    ordinal_position AS posicao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'destinations',
    'experiences',
    'tags',
    'personas',
    'experience_tags',
    'experience_personas',
    'engine_configs',
    'admin_users',
    'admin_roles',
    'operating_hours',
    'operating_hour_exceptions',
    'transit_options'
  )
ORDER BY table_name, ordinal_position;


-- -----------------------------------------------------------------------------
-- B. RLS
-- -----------------------------------------------------------------------------
SELECT
    c.relname AS tabela,
    c.relkind AS tipo_relacao,
    c.relrowsecurity AS rls_habilitada,
    c.relforcerowsecurity AS rls_forcada
FROM pg_class AS c
JOIN pg_namespace AS n
  ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname IN (
    'destinations',
    'experiences',
    'tags',
    'personas',
    'experience_tags',
    'experience_personas',
    'engine_configs',
    'admin_users',
    'admin_roles',
    'operating_hours',
    'operating_hour_exceptions',
    'transit_options'
  )
ORDER BY c.relname;


-- -----------------------------------------------------------------------------
-- C. POLICIES
-- -----------------------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'destinations',
    'experiences',
    'tags',
    'personas',
    'experience_tags',
    'experience_personas',
    'engine_configs',
    'admin_users',
    'admin_roles',
    'operating_hours',
    'operating_hour_exceptions',
    'transit_options'
  )
ORDER BY tablename, policyname;


-- -----------------------------------------------------------------------------
-- D. GRANTS DE TABELA
-- Usa table_privileges para também capturar PUBLIC quando disponível.
-- -----------------------------------------------------------------------------
SELECT
    table_schema,
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'destinations',
    'experiences',
    'tags',
    'personas',
    'experience_tags',
    'experience_personas',
    'engine_configs',
    'admin_users',
    'admin_roles',
    'operating_hours',
    'operating_hour_exceptions',
    'transit_options'
  )
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY table_name, grantee, privilege_type;


-- -----------------------------------------------------------------------------
-- E. CONSTRAINTS E FOREIGN KEYS
-- -----------------------------------------------------------------------------
SELECT
    cl.relname AS table_name,
    con.conname AS constraint_name,
    CASE con.contype
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'c' THEN 'CHECK'
      WHEN 'x' THEN 'EXCLUSION'
      ELSE con.contype::text
    END AS constraint_type,
    pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint AS con
JOIN pg_class AS cl
  ON cl.oid = con.conrelid
JOIN pg_namespace AS n
  ON n.oid = cl.relnamespace
WHERE n.nspname = 'public'
  AND cl.relname IN (
    'destinations',
    'experiences',
    'tags',
    'personas',
    'experience_tags',
    'experience_personas',
    'engine_configs',
    'admin_users',
    'admin_roles',
    'operating_hours',
    'operating_hour_exceptions',
    'transit_options'
  )
ORDER BY cl.relname, constraint_type, con.conname;


-- -----------------------------------------------------------------------------
-- F. FUNÇÃO PUBLIC.IS_ADMIN()
-- Não lê usuários. Verifica definição, owner, segurança e acesso efetivo.
-- -----------------------------------------------------------------------------
SELECT
    p.oid::regprocedure AS funcao,
    pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef AS security_definer,
    p.proconfig AS configuracoes_da_funcao,
    p.proacl AS acl_da_funcao,
    has_function_privilege(
      'anon',
      p.oid,
      'EXECUTE'
    ) AS anon_pode_executar,
    has_function_privilege(
      'authenticated',
      p.oid,
      'EXECUTE'
    ) AS authenticated_pode_executar,
    pg_get_functiondef(p.oid) AS definicao
FROM pg_proc AS p
JOIN pg_namespace AS n
  ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'is_admin'
ORDER BY p.oid;


-- -----------------------------------------------------------------------------
-- G. MIGRATIONS APLICADAS
-- Remove o conteúdo potencialmente longo da coluna statements.
-- Funciona mesmo que inserted_at não exista.
-- -----------------------------------------------------------------------------
SELECT
    to_jsonb(m) - 'statements' AS migration_metadata
FROM supabase_migrations.schema_migrations AS m
ORDER BY m.version;
