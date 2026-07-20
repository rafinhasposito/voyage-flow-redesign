# ADMIN-2B.1B e ADMIN-2B.2A.1 - Relatório de Validação Física em Ambiente Isolado

## 1. Status do Supabase Local
O ambiente local PostgreSQL foi configurado via Docker Desktop (container `supabase_db_voyage-flow-redesign`) e as validações físicas foram executadas isoladamente do projeto de produção.

**Processo:**
- **Schema Public:** Criado e resetado limpo;
- **Roles:** Foram provisionadas roles básicas (`anon`, `authenticated`), com grants de acesso e tabelas adequados no mock;
- **Docker Engine:** Container manteve estabilidade total e executou com sucesso a primeira execução, segunda execução (idempotência) e todas as assertions de segurança.

## 2. O que Mudou na Migration Candidate (Pós Preflight - ADMIN-2B.2A.1)
A migration candidata oficial (`20260720080000_admin_backend_foundation.sql`) foi compatibilizada com o schema remoto real:
- **Resolução de Conflito Crítico:** Todas as dependências (Foreign Keys) e validações RLS (`EXISTS`) referentes à tabela `admin_users` foram atualizadas de `admin_users(id)` para `admin_users(user_id)`.
- **Reforço de Segurança RLS:** As políticas RLS garantem validação dupla `WHERE user_id = auth.uid() AND is_active = true`.

## 3. O que Mudou nas Assertions
O roteiro de homologação (`admin_backend_foundation_test.sql`) foi atualizado e endurecido:
- O mock de `admin_users` no setup local foi corrigido para corresponder exatamente à tabela real (`user_id` uuid NOT NULL PRIMARY KEY).
- Foram incluídas as assertions **21 e 22** garantindo que nenhuma policy no Postgres, nem constraint Foreign Key, faz referência à coluna `id` da tabela `admin_users`.

## 4. Resultado Completo
Todas as 22 assertions foram avaliadas fisicamente dentro do banco isolado.

**Resumo das Execuções:**
- **Primeira Execução (Setup Inicial):** Êxito total.
- **Segunda Execução (Idempotência):** Êxito total. O log registrou `relation already exists, skipping` corretamente.
- **Assertions:** 22/22 Testes concluídos com sucesso sem bypass de RLS.

**Log Oficial de Validação:**
1. **Passou:** Valor negativo rejeitado em orders (CHECK constraint).
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
21. **Passou:** Nenhuma policy depende de admin_users.id.
22. **Passou:** Nenhuma FK aponta para admin_users.id.

O pacote está tecnicamente apto, provado fisicamente e compatível com a estrutura de `admin_users.user_id` do banco de dados remoto da Voyage Flow.
