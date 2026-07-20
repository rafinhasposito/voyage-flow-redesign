# ADMIN-2B.1B - Relatório de Validação Física em Ambiente Isolado

## 1. Status do Supabase Local
O ambiente local PostgreSQL foi configurado via Docker Desktop (container `supabase_db_voyage-flow-redesign`) e as validações físicas foram executadas isoladamente do projeto de produção. 

**Processo:**
- **Schema Public:** Criado e resetado limpo;
- **Roles:** Foram provisionadas roles básicas (`anon`, `authenticated`), com grants de acesso e tabelas adequados no mock;
- **Docker Engine:** Container manteve estabilidade total e executou com sucesso a primeira execução, segunda execução (idempotência) e todas as assertions de segurança.

## 2. O que Mudou na Migration Candidate
A migration candidata oficial (`20260720080000_admin_backend_foundation.sql`) recebeu melhorias finais cruciais antes de sua aprovação:
- **Novas Constraints de Integridade (CHECKs):** Implementadas na tabela `orders` para garantir consistência (`total_net >= 0` e `total_gross >= 0`) e na tabela `affiliate_links` para validação obrigatória do `http` no `tracked_url`.
- **Reforço de Segurança RLS (Admin Inativo):** Todas as 10 políticas de RLS exclusivas para administrador foram atualizadas de `EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())` para `EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)`. Isso bloqueia leitura/escrita acidental caso um administrador seja suspenso (is_active = false).

## 3. O que Mudou nas Assertions
O roteiro de homologação (`admin_backend_foundation_test.sql`) foi atualizado e endurecido:
- **Mapeamento de Schema Estrito:** Ajustes precisos de nomenclaturas (`total_net` em vez de `base_cost`, e `platform` no lugar de `name`) garantiram o alinhamento com a estrutura da tabela real.
- **Isolamento e Controle de Foreign Keys:** As inserções de mock `profiles` e `auth.users` foram refeitas com `ON CONFLICT DO NOTHING`, evitando falhas residuais nas reinserções de testes de exclusão (CASCADE rules).
- **Adequação de Exceções RLS:** O teste nº 16 foi reconstruído para capturar bloqueios silenciosos (UPDATE 0 rows), comportamento nativo do PostgreSQL onde políticas RLS do tipo `USING` apenas escondem a linha e não lançam `insufficient_privilege` sem cláusula `WITH CHECK`.
- **Grants Explícitos em Testes:** `GRANT ALL ON ALL TABLES/SEQUENCES IN SCHEMA public` foi implementado no cabeçalho dos testes, substituindo a automatização feita em migrations aplicadas, simulando estritamente os acessos de `anon` e `authenticated`.

## 4. Resultado Completo
Todas as 20 assertions foram avaliadas fisicamente dentro do banco isolado. 

**Resumo das Execuções:**
- **Primeira Execução (Setup Inicial):** Êxito.
- **Segunda Execução (Idempotência):** Êxito. Tabelas preexistentes foram ignoradas corretamente (`IF NOT EXISTS`) e as policies recriadas adequadamente (`DROP POLICY IF EXISTS`).
- **Assertions:** 20/20 Testes concluídos com sucesso sem bypass de RLS.

**Log Oficial de Validação:**
1. **Passou:** Valor negativo rejeitado em orders (`total_net`/`total_gross`) (CHECK constraint).
2. **Passou:** Moeda inválida rejeitada (CHECK constraint em `currency`).
3. **Passou:** Configuração duplicada rejeitada (UNIQUE em `key`).
4. **Passou:** Idempotency Key duplicada rejeitada (UNIQUE constraint).
5. **Passou:** Múltiplas tentativas de pagamento aceitas.
6. **Passou:** Pedido mantido com usuário null após exclusão da tabela raiz (SET NULL).
7. **Passou:** Item de pedido mantido com experiência null após exclusão da tabela raiz (SET NULL).
8. **Passou:** Evento sem nome rejeitado em analytics (NOT NULL constraints).
9. **Passou:** Programa afiliado sem parceiro rejeitado (NOT NULL constraints).
10. **Passou:** Link afiliado sem http rejeitado (CHECK url validation).
11. **Passou:** Configuração pública acessível por role anon (RLS read auth).
12. **Passou:** Configuração privada bloqueada por role anon (RLS privacy strict mode).
13. **Passou:** Pagamentos ocultos publicamente (RLS default block action).
14. **Passou:** Analytics não aceita escrita de role anon (RLS Insert protection).
15. **Passou:** Usuário comum vê apenas suas próprias orders (RLS constraint).
16. **Passou:** Usuário comum bloqueado em partners (RLS silenciosamente atualizou 0 rows).
17. **Passou:** Profile protegido por proprietário.
18. **Passou:** Link afiliado permite leitura publica de role anon (uso promocional protegido).
19. **Passou:** Admin inativo bloqueado por RLS (validação estrita do `is_active=true`).
20. **Passou:** Admin ativo tem acesso global às orders (Privilégio validado).

O pacote está tecnicamente apto, provado fisicamente, sem causar corrupção de schema e aplicando restrições seguras de Row-Level Security, estando pronto para a fase de deploy de homologação na nuvem real.
