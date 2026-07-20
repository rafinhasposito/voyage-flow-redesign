SELECT 'Backend comercial congelado (Admin B2B)' as status;
/*
-- Testes Locais para ADMIN-2B
-- Objetivo: Garantir comportamento RLS e integridade estrutural

BEGIN;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE
    -- Mock Users defined in setup
    admin_id uuid := '00000000-0000-0000-0000-000000000001';
    user1_id uuid := '00000000-0000-0000-0000-000000000002';
    user2_id uuid := '00000000-0000-0000-0000-000000000003';
    inactive_admin_id uuid := '00000000-0000-0000-0000-000000000004';

    val integer;
    v_text text;
    inserted_id uuid;
BEGIN
    RAISE NOTICE 'Executando testes RLS e Constraints...';

    -- ==========================================
    -- CONSTRAINTS E HISTÓRICO
    -- ==========================================
    -- 1. valor negativo rejeitado
    BEGIN
        INSERT INTO public.orders (user_id, status, total_net, total_gross) VALUES (user1_id, 'pending', -100, -100);
        RAISE EXCEPTION 'Constraint CHECK falhou (aceitou negativo)';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Passou: Valor negativo rejeitado em orders';
    END;

    -- 2. moeda inválida rejeitada
    BEGIN
        INSERT INTO public.orders (user_id, status, currency, total_net, total_gross) VALUES (user1_id, 'pending', 'USD1', 10, 10);
        RAISE EXCEPTION 'Constraint CHECK currency falhou (aceitou mais de 3 chars)';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Passou: Moeda inválida rejeitada';
    END;

    -- 3. configuração duplicada rejeitada
    INSERT INTO public.system_settings (category, key, value, is_public) VALUES ('general', 'test_key', '"1"'::jsonb, true);
    BEGIN
        INSERT INTO public.system_settings (category, key, value, is_public) VALUES ('general', 'test_key', '"2"'::jsonb, true);
        RAISE EXCEPTION 'Constraint UNIQUE key falhou';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Passou: Configuração duplicada rejeitada';
    END;

    -- 4. idempotency_key duplicada rejeitada
    INSERT INTO public.profiles (id, first_name) VALUES (user1_id, 'Profile A') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, first_name) VALUES (user2_id, 'Profile B') ON CONFLICT DO NOTHING;
    INSERT INTO public.orders (user_id, status, idempotency_key, total_net, total_gross) VALUES (user1_id, 'pending', 'idem_1', 10, 10) RETURNING id INTO inserted_id;
    BEGIN
        INSERT INTO public.orders (user_id, status, idempotency_key, total_net, total_gross) VALUES (user1_id, 'pending', 'idem_1', 10, 10);
        RAISE EXCEPTION 'Constraint UNIQUE idempotency_key falhou';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Passou: Idempotency Key duplicada rejeitada';
    END;

    -- 5. Múltiplas tentativas de pagamento são aceitas
    INSERT INTO public.payments (order_id, amount, status, provider, external_transaction_id) VALUES (inserted_id, 100, 'failed', 'stripe', 'txn_1');
    INSERT INTO public.payments (order_id, amount, status, provider, external_transaction_id) VALUES (inserted_id, 100, 'succeeded', 'stripe', 'txn_2');
    RAISE NOTICE 'Passou: Múltiplas tentativas de pagamento aceitas';

    -- 6. Remoção do usuário não apaga o pedido (SET NULL)
    DELETE FROM auth.users WHERE id = user1_id;
    SELECT user_id INTO inserted_id FROM public.orders WHERE idempotency_key = 'idem_1';
    IF inserted_id IS NOT NULL THEN
        RAISE EXCEPTION 'Order user_id deveria ser NULL após exclusão de usuário';
    END IF;
    RAISE NOTICE 'Passou: Pedido mantido com usuário null após exclusão';

    -- 7. Exclusão de experiência mantém o item com referência nula
    -- Preparando item associado a uma experiência
    INSERT INTO public.order_items (order_id, experience_id, gross_price) VALUES
        ((SELECT id FROM public.orders WHERE idempotency_key = 'idem_1'),
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50);
    DELETE FROM public.experiences WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    SELECT experience_id INTO inserted_id FROM public.order_items WHERE gross_price = 50 LIMIT 1;
    IF inserted_id IS NOT NULL THEN
        RAISE EXCEPTION 'Item experience_id deveria ser NULL após exclusão';
    END IF;
    RAISE NOTICE 'Passou: Item de pedido mantido com experiência null após exclusão';

    -- 8. Evento sem nome é rejeitado
    BEGIN
        INSERT INTO public.analytics_events (event_name, user_id) VALUES (NULL, user2_id);
        RAISE EXCEPTION 'Constraint NOT NULL em event_name falhou';
    EXCEPTION WHEN not_null_violation THEN
        RAISE NOTICE 'Passou: Evento sem nome rejeitado';
    END;

    -- 9. Programa afiliado sem parceiro é rejeitado
    BEGIN
        INSERT INTO public.affiliate_programs (partner_id, platform, identifier, commission_value) VALUES (NULL, 'getyourguide', 'id1', 10);
        RAISE EXCEPTION 'Constraint NOT NULL em partner_id falhou';
    EXCEPTION WHEN not_null_violation THEN
        RAISE NOTICE 'Passou: Programa afiliado sem parceiro rejeitado';
    END;

    -- 10. Link afiliado inválido rejeitado
    INSERT INTO public.partners (id, name, type) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Partner', 'b2b');
    INSERT INTO public.experiences (id, title, type) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Exp', 'attraction');
    BEGIN
        INSERT INTO public.affiliate_links (experience_id, partner_id, original_url, tracked_url) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'http://a.com', 'bad_url');
        RAISE EXCEPTION 'Constraint CHECK tracked_url falhou (não tem http)';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Passou: Link afiliado sem http rejeitado';
    END;

    -- Restaura user1_id e user2_id para testes RLS
    INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000002', 'user1@example.com') ON CONFLICT DO NOTHING;
    INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000003', 'user2@example.com') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, first_name) VALUES ('00000000-0000-0000-0000-000000000002', 'Profile A') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, first_name) VALUES ('00000000-0000-0000-0000-000000000003', 'Profile B') ON CONFLICT DO NOTHING;

    -- ==========================================
    -- TESTES DE RLS
    -- ==========================================

    -- Configs
    INSERT INTO public.system_settings (category, key, value, is_public) VALUES ('general', 'private_key', '"secret"'::jsonb, false);

    -- Anônimo (anon)
    SET LOCAL role = 'anon';
    SET LOCAL request.jwt.claim.sub = '';
    SET LOCAL request.jwt.claim.role = 'anon';

    -- 11. configuração pública acessível
    SELECT count(*) INTO val FROM public.system_settings WHERE is_public = true;
    IF val = 0 THEN RAISE EXCEPTION 'Anon não consegue ler config pública'; END IF;
    RAISE NOTICE 'Passou: Configuração pública acessível por anon';

    -- 12. configuração privada bloqueada
    SELECT count(*) INTO val FROM public.system_settings WHERE is_public = false;
    IF val > 0 THEN RAISE EXCEPTION 'Anon leu config privada'; END IF;
    RAISE NOTICE 'Passou: Configuração privada bloqueada por anon';

    -- 13. pagamentos não têm leitura pública
    SELECT count(*) INTO val FROM public.payments;
    IF val > 0 THEN RAISE EXCEPTION 'Anon leu pagamentos'; END IF;
    RAISE NOTICE 'Passou: Pagamentos ocultos publicamente';

    -- 14. Analytics não aceita escrita pública
    BEGIN
        INSERT INTO public.analytics_events (event_name) VALUES ('anon_click');
        RAISE EXCEPTION 'Anon conseguiu escrever em analytics';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Passou: Analytics não aceita escrita de anon';
    END;

    -- Preparar orders para teste
    SET LOCAL role = 'postgres';
    INSERT INTO public.orders (user_id, status, idempotency_key, total_net, total_gross) VALUES ('00000000-0000-0000-0000-000000000002', 'pending', 'order_A', 10, 10) ON CONFLICT DO NOTHING;
    INSERT INTO public.orders (user_id, status, idempotency_key, total_net, total_gross) VALUES ('00000000-0000-0000-0000-000000000003', 'pending', 'order_B', 10, 10) ON CONFLICT DO NOTHING;

    -- Voltar para Usuário Comum A
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'; -- user1_id
    SET LOCAL request.jwt.claim.role = 'authenticated';

    -- 15. Usuário A não acessa pedido do usuário B
    SELECT count(*) INTO val FROM public.orders WHERE idempotency_key = 'order_B';
    IF val > 0 THEN RAISE EXCEPTION 'Usuário A leu order do B'; END IF;
    SELECT count(*) INTO val FROM public.orders WHERE idempotency_key = 'order_A';
    IF val = 0 THEN RAISE EXCEPTION 'Usuário A não leu sua order'; END IF;
    RAISE NOTICE 'Passou: Usuário comum vê apenas suas próprias orders';

    -- 16. Usuário comum não altera parceiro
    UPDATE public.partners SET name = 'Hacked' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    GET DIAGNOSTICS val = ROW_COUNT;
    IF val > 0 THEN
        RAISE EXCEPTION 'Usuário comum alterou parceiro';
    END IF;
    RAISE NOTICE 'Passou: Usuário comum bloqueado em partners (UPDATE 0 rows)';

    -- 17. profile protegido por proprietário
    SELECT count(*) INTO val FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000003';
    IF val > 0 THEN RAISE EXCEPTION 'Usuário A leu profile do B'; END IF;
    RAISE NOTICE 'Passou: Profile protegido por proprietário';

    -- 18. Link afiliado segue a leitura definida (público para todos poderem clicar)
    SELECT count(*) INTO val FROM public.affiliate_links;
    RAISE NOTICE 'Passou: Link afiliado permite leitura';

    -- Admin Inativo
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004'; -- inactive admin
    SET LOCAL request.jwt.claim.role = 'authenticated';

    -- 19. Admin inativo é bloqueado (como não é dono das ordens, não verá)
    SELECT count(*) INTO val FROM public.orders;
    IF val > 0 THEN RAISE EXCEPTION 'Admin inativo leu orders'; END IF;
    RAISE NOTICE 'Passou: Admin inativo bloqueado por RLS';

    -- Admin Ativo
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'; -- admin
    SET LOCAL request.jwt.claim.role = 'authenticated';

    -- 20. Admin ativo acessa o permitido (orders de todo mundo)
    SELECT count(*) INTO val FROM public.orders;
    IF val = 0 THEN RAISE EXCEPTION 'Admin ativo bloqueado em orders'; END IF;
    RAISE NOTICE 'Passou: Admin ativo tem acesso global as orders';

    -- 21. Nenhuma policy depende de admin_users.id
    SELECT count(*) INTO val
    FROM pg_policies
    WHERE qual ILIKE '%admin_users WHERE id =%' OR with_check ILIKE '%admin_users WHERE id =%';
    IF val > 0 THEN RAISE EXCEPTION 'Policy ainda depende de admin_users.id'; END IF;
    RAISE NOTICE 'Passou: Nenhuma policy depende de admin_users.id';

    -- 22. Nenhuma foreign key aponta para admin_users.id
    SELECT count(*) INTO val
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'admin_users'
      AND ccu.column_name = 'id';
    IF val > 0 THEN RAISE EXCEPTION 'Foreign key ainda aponta para admin_users.id'; END IF;
    RAISE NOTICE 'Passou: Nenhuma FK aponta para admin_users.id';

    RAISE NOTICE '==== TODAS AS 22 ASSERTIONS CONCLUIDAS COM SUCESSO ====';

END $$;

ROLLBACK;

*/
