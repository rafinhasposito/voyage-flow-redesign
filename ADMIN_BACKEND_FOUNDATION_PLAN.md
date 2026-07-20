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

## 5.1 Estratégia de Criação de Perfis (auth.users -> public.profiles)
**Opção B Escolhida (Criação pela Aplicação/Edge Function):**
* O profile será criado durante o onboarding autenticado do aplicativo.
* A operação será idempotente com `upsert`.
* O `id` inserido em `public.profiles` deverá ser o exato UUID oriundo do `auth.users`.
* A ausência temporária do profile **não** bloqueará a autenticação base.
* Páginas que dependem de profile no Frontend tratarão o estado ausente.
* Não copiar `user_metadata` integral.
* Não armazenar tokens ou chaves de autenticação.
* A Fase ADMIN-3 será a responsável por construir a integração desta entidade no painel B2B.
* **Decisão:** Não criaremos um Database Trigger (Security Definer) para esta tabela agora.

* **ADMIN-2A** — Auditoria e proposta segura de backend: **Concluído**
- [x] **ADMIN-2B.1A** — Validação estática e pacote de homologação concluídos
- [x] **ADMIN-2B.1B** — Validação física de banco e RLS concluída
- [x] **ADMIN-2B.2A** — Preflight remoto concluído
- [x] **ADMIN-2B.2A.1** — Compatibilização local e validação física repetida concluída
- [ ] **ADMIN-2B.2** — Aplicação controlada no projeto real aguardando autorização

**Fatos da Fase ADMIN-2B:**
* Preflight remoto bloqueou a versão anterior (incompatibilidade de schema `user_id` vs `id`).
* Migration e testes locais reescritos para usar `user_id`.
* 22 assertions SQL executadas em banco isolado Docker; 22 passaram.
* 4 testes TypeScript da Edge Function aprovados; 272 globais passaram.
* 0 testes reais de RLS;
* 4 testes TypeScript dos helpers aprovados; 272 testes globais aprovados; build aprovado;
* Aplicação real reprovada até existir homologação física.

* **Gate 1** — Mover candidata para `supabase/migrations` (comando: `mv supabase/migration_candidates/20260720080000_admin_backend_foundation.sql supabase/migrations/20260720080000_admin_backend_foundation.sql`).
* **Gate 2** — Conferir diff e histórico do Git para garantir pureza da migration.
* **Gate 3** — Aplicar migration remotamente: `npx supabase db push`.
* **Gate 4** — Verificar no Dashboard remoto se as tabelas foram criadas, fazer contagens e checar RLS aplicadas.
* **Gate 5** — Regenerar tipos localmente: `npx supabase gen types typescript --project-id idcucjpanzufkipvfmse > src/types/supabase.types.ts`.
* **Gate 6** — Testar (build/vitest) e commitar tipos atualizados.
* **Gate 7** — Configurar variáveis de CORS no Vercel para a Edge Function.
* **Gate 8** — Deploy da Edge Function: `npx supabase functions deploy admin-list-users --no-verify-jwt`.
* **Gate 9** — Testar a autenticação da função na prática com a UI.
* **Gate 10** — Iniciar fase ADMIN-3.

---

## 7. Plano de Rollback 

**Acionamento:** Em caso de quebra estrutural (tabelas parcialmente criadas), falha na Edge Function, RLS conflitando com catálogo existente ou quebra de tipos irrecuperável.
**Diretriz:** Rollback não destrutivo; jamais usar scripts automáticos que removam dados criados após a migração se os mesmos possuírem lastro financeiro.
**Ações:**
1. Desabilitar Edge Function B2C: `supabase functions delete admin-list-users`.
2. Se a migration falhar na aplicação, restaurar o último backup Snapshot via Dashboard.
3. Se a interface quebrar por tipagem: Reverter o commit Frontend, recriar os tipos usando a CLI apontando para o status anterior do schema e usar os contratos B2B provisórios.
4. Caso a RLS vaze permissões, executar script de emergência: `ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;` até a revisão da política.

**Status Atual:** ADMIN-2B.2A.1 — Compatibilização local com schema remoto concluída. A migration candidata provou compatibilidade estrutural com `user_id` no ambiente local e passou em todos os testes. Nenhuma alteração aplicada ao banco real ainda.
