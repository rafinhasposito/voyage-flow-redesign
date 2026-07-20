BEGIN;
SELECT plan(16);

-- 1. Criação das colunas de onboarding (Migration 00002)
SELECT has_column('public', 'trips', 'preferences', 'Trips has preferences JSONB column');
SELECT has_column('public', 'trips', 'fixed_commitments', 'Trips has fixed_commitments JSONB column');

-- 2. Criação das Tabelas e Indices (Migration 00003)
SELECT has_table('public', 'trip_reservations', 'trip_reservations table exists');
SELECT has_table('public', 'trip_documents', 'trip_documents table exists');
SELECT has_fk('public', 'trip_reservations', 'trip_reservations has foreign keys');
SELECT has_fk('public', 'trip_documents', 'trip_documents has foreign keys');
SELECT col_default_is('public', 'trip_reservations', 'purchase_status', 'undecided', 'Default purchase_status is undecided');
SELECT col_default_is('public', 'trip_documents', 'offline_enabled', false, 'Default offline is false');

SELECT is_empty(
    $$SELECT 1 FROM information_schema.role_table_grants WHERE grantee = 'authenticated' AND table_name = 'trip_reservations' AND privilege_type = 'TRUNCATE'$$,
    'TRUNCATE privilege should not be granted on trip_reservations'
);
SELECT is_empty(
    $$SELECT 1 FROM information_schema.role_table_grants WHERE grantee = 'authenticated' AND table_name = 'trip_documents' AND privilege_type = 'TRUNCATE'$$,
    'TRUNCATE privilege should not be granted on trip_documents'
);

-- 3. Inserir Mock Users (A e B) para RLS
INSERT INTO auth.users (id, email) VALUES 
('a0000000-0000-0000-0000-00000000000a', 'User'),
('b0000000-0000-0000-0000-00000000000b', 'A');

INSERT INTO public.profiles (id, first_name, last_name) VALUES
('a0000000-0000-0000-0000-00000000000a', 'User A', 'User'),
('b0000000-0000-0000-0000-00000000000b', 'User B', 'A');

-- Criar viagens para A e B
INSERT INTO public.trips (id, title, destination, status, user_id, start_date, end_date) VALUES
('c0000000-0000-0000-0000-00000000000a', 'Trip A', 'Paris', 'planning', 'a0000000-0000-0000-0000-00000000000a', '2026-08-01', '2026-08-10'),
('c0000000-0000-0000-0000-00000000000b', 'Trip B', 'Rome', 'planning', 'b0000000-0000-0000-0000-00000000000b', '2026-09-01', '2026-09-10');

-- 4. RLS - Usuário A cria reserva em sua viagem
SET request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
SET request.jwt.claim.role = 'authenticated';
SET role authenticated;

INSERT INTO public.trip_reservations (id, trip_id, type) VALUES ('d0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'flight');
SELECT results_eq(
    'SELECT count(*) FROM public.trip_reservations WHERE trip_id = ''c0000000-0000-0000-0000-00000000000a''',
    ARRAY[1::bigint],
    'User A can insert and view own reservation'
);

-- Tenta inserir em viagem de B, deve falhar no CHECK constraint
PREPARE insert_b AS INSERT INTO public.trip_reservations (id, trip_id, type) VALUES ('e0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b', 'hotel');
SELECT throws_ok('insert_b', 'new row violates row-level security policy for table "trip_reservations"', 'User A cannot insert into User B trip');

-- 5. RLS - Troca para Usuário B
SET request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
SELECT results_eq(
    'SELECT count(*) FROM public.trip_reservations',
    ARRAY[0::bigint],
    'User B cannot view User A reservations'
);

-- 6. Storage Policies
RESET role;
SELECT results_eq(
    'SELECT count(*) FROM storage.buckets WHERE id = ''trip-documents'' AND public = false',
    ARRAY[1::bigint],
    'Private bucket trip-documents exists'
);

SELECT results_eq(
    'SELECT count(*) FROM pg_policies WHERE tablename = ''objects'' AND policyname = ''Users can upload their own trip documents''',
    ARRAY[1::bigint],
    'Storage insert policy exists'
);

SELECT results_eq(
    'SELECT count(*) FROM pg_policies WHERE tablename = ''objects'' AND policyname = ''Users can view their own trip documents''',
    ARRAY[1::bigint],
    'Storage view policy exists'
);

-- Limpeza e Rollback do PgTap test mode
SELECT * FROM finish();
ROLLBACK;
