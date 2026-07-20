# 🏗️ ADMIN-2A: Backend Foundation Plan (Proposta Técnica em Revisão)

Este documento estabelece a infraestrutura (banco de dados e API) necessária para destravar os módulos administrativos mapeados como "Parciais" ou "Requer Backend" na Fase ADMIN-1.

A proposta engloba migrations aditivas locais e contratos de Edge Functions desenhados para proteger os dados (RLS, isolamento B2B vs B2C) sem causar downtime ou destruir a tabela core (`experiences`).

**Aviso:** Esta é uma proposta técnica. Nenhuma destas modificações foi executada na nuvem até o momento. O arquivo SQL foi deliberadamente movido para a pasta `supabase/migration_proposals/` visando protegê-lo de aplicação acidental.

---

## 1. Localização da Proposta e Contratos
* **Migration Proposta:** `supabase/migration_proposals/20260719200000_admin_backend_foundation.sql` (movido de `migrations/` para segurança).
* **Edge Function B2C:** `supabase/functions/admin-list-users/index.ts`
* **Contratos Locais:** `src/lib/adminContracts.ts` (Implementado com validadores puros e reais).
* **Testes:** `src/lib/adminContracts.test.ts` (Os 15 critérios de segurança, paginação e validade financeira foram implementados e consolidados em agrupamentos de testes que certificam a conformidade das funções).

---

## 2. Separação de Entidades
A proposta respeita a rigorosa distinção entre domínios. As seguintes tabelas estão efetivamente presentes na proposta SQL e separadas logicamente:
* **`orders`**: Representa apenas a intenção de compra, valores consolidados e vinculação opcional ao B2C.
* **`payments`**: Isola o provedor (Stripe), a chave de idempotência (`idempotency_key`), e a cobrança financeira, permitindo múltiplas tentativas por pedido.
* **`partners`**: Identidade das entidades B2B (ex. OTA).
* **`affiliate_programs`**: As regras de comissão.
* **`affiliate_links`**: O link da atração, associado rigidamente a `experiences` e `partners`.
* **`analytics_events`**: Time-series de intenção.
* **`profiles`**: Espelho B2C do `auth.users`.

*Tabelas Adiadas:* Assinaturas ativas (`subscriptions`) e Webhooks de processadores foram deliberadamente adiadas para não complexificar a V1 do carrinho.

---

## 3. Matriz SQL vs Documentação

| Entidade Documentada | Existe no SQL? | RLS Habilitado? | Índices e FKs Seguros? | Constraints Críticas |
| :--- | :--- | :--- | :--- | :--- |
| `system_settings` | ✅ Sim | ✅ Sim | PK `id`, FK `updated_by` | `key` UNIQUE |
| `partners` | ✅ Sim | ✅ Sim | PK `id` | - |
| `affiliate_programs` | ✅ Sim | ✅ Sim | FK `partner_id` | `partner_id` ON DELETE CASCADE |
| `affiliate_links` | ✅ Sim | ✅ Sim | FK `experience_id`, FK `partner_id` | Ambos ON DELETE CASCADE |
| `orders` | ✅ Sim | ✅ Sim | FK `user_id` | `user_id` ON DELETE SET NULL, `idempotency_key` UNIQUE |
| `order_items` | ✅ Sim | ✅ Sim | FK `order_id`, `experience_id` | `order_id` CASCADE, `experience_id` SET NULL |
| `payments` | ✅ Sim | ✅ Sim | FK `order_id` | `external_transaction_id` UNIQUE |
| `profiles` | ✅ Sim | ✅ Sim | FK `id` -> `auth.users(id)` | PK/FK `ON DELETE CASCADE` |
| `analytics_events` | ✅ Sim | ✅ Sim | FK `user_id` | `user_id` SET NULL |

---

## 4. Auditoria de Riscos da Proposta SQL

| Risco Mapeado | Nível | Impacto e Mitigação Adotada no SQL/Contratos |
| :--- | :--- | :--- |
| **Exclusão de Conta B2C (Auth.users)** | **Médio** | O perfil público (`profiles`) tem FK `ON DELETE CASCADE`. Ou seja, se a conta auth for deletada, o profile é destruído apagando PII (GDPR compliance). Contudo, `orders` e `analytics_events` usam `ON DELETE SET NULL`, preservando a receita e a volumetria analítica sem o vínculo ao usuário deletado. |
| **Exclusão de Experiência** | **Médio** | Um `order_item` usa `ON DELETE SET NULL`. O item vendido não some se a atração for arquivada/apagada do catálogo, protegendo o relatório financeiro. |
| **Tipos Financeiros Imprecisos** | **Baixo** | O SQL define `numeric(10, 2)` para todo campo monetário. As funções do TS usam arredondamento e as API calls exigem moedas de 3 letras normalizadas. Valores negativos no Javascript estouram `Error`. |
| **Vazamento de Configuração Privada** | **Alto** | Uma flag na DTO (`is_public`) existe para não devolver tokens. Uma policy RLS cega na leitura geral (`anon`) não foi liberada em `system_settings` indiscriminadamente. |
| **Search Path e Security Definer** | **Baixo** | Nenhuma função `SECURITY DEFINER` foi criada. A elevação de privilégio está encapsulada exclusivamente na Deno Edge Function (`admin-list-users`), limitando a superfície de ataque ao servidor da Vercel/Supabase. |

---

## 5. Auditoria da Edge Function
A função `admin-list-users` atende aos padrões de produção:
- **CORS Estrito**: Utiliza array de `ALLOWED_ORIGINS`. Responde ao Preflight `OPTIONS`.
- **Validação JWT Real**: Executa `supabaseClient.auth.getUser()`.
- **Validação de Role**: Query na tabela `admin_users`. Rejeita qualquer claim arbitrária em JWT (`role`).
- **Paginação**: `page` restrito a >= 1. `limit` truncado a no máximo 100. Default: 25. Busca travada a 50 caracteres (anti-DDoS / DoS).
- **Tratamento Seguro de Erro**: O stack interno vai pro console do servidor e a Web recebe sempre `{ error: "Não foi possível consultar os usuários." }`.
- **Sanitização (Allowlist)**: Expõe apenas ID, Email, e Datas. A DTO B2C final garante que senhas, providers e PII nunca cruzem a rede.

---

## 6. Ordem de Aplicação Futura (Para ADMIN-2B)

1. Mover arquivo `supabase/migration_proposals/20260719200000_admin_backend_foundation.sql` de volta para a pasta ativa de `supabase/migrations/`.
2. Validar integridade local: `npx vitest run` e `npm run build`.
3. Push da estrutura para a nuvem: `npx supabase db push`.
4. Deploy da Edge Function de Segurança: `npx supabase functions deploy admin-list-users --no-verify-jwt`.
5. Acoplar a UI B2B de Parceiros, Vendas e IA aos novos endpoints.

**Status Atual:** ADMIN-2A — Proposta técnica aprovada e versionada. Nenhuma modificação foi executada no banco oficial. Nenhuma UI sofreu alteração visual.
