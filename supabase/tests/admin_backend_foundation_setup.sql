-- Setup Local para ADMIN-2B
-- Criando schemas, extensões, tabelas base, roles, functions necessárias

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar schemas caso não existam
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mock do `public.admin_users` mínimo
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Mock do `public.experiences` mínimo
CREATE TABLE IF NOT EXISTS public.experiences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    type text NOT NULL,
    category text,
    status varchar(50) DEFAULT 'published'
);

-- Roles padrões do Supabase que o arquivo de candidate pode usar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- Dar permissões mínimas nas roles base para acessar schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Limpeza de roles caso estivessem testadas antes
DELETE FROM public.admin_users;
DELETE FROM public.experiences;

-- Inserir usuários fictícios para a homologação
-- User A (Admin)
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'admin@example.com') ON CONFLICT DO NOTHING;
INSERT INTO public.admin_users (id, is_active) VALUES ('00000000-0000-0000-0000-000000000001', true) ON CONFLICT DO NOTHING;

-- User B (Comum 1)
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000002', 'user1@example.com') ON CONFLICT DO NOTHING;

-- User C (Comum 2)
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000003', 'user2@example.com') ON CONFLICT DO NOTHING;

-- User D (Admin inativo)
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000004', 'admin-inactive@example.com') ON CONFLICT DO NOTHING;
INSERT INTO public.admin_users (id, is_active) VALUES ('00000000-0000-0000-0000-000000000004', false) ON CONFLICT DO NOTHING;

-- Mock experience
INSERT INTO public.experiences (id, title, type) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Experience A', 'attraction');

COMMIT;
