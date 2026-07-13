# Plano de Segurança do Admin (Voyage Flow) - v1.1

Este documento estabelece o contrato definitivo de segurança administrativa do projeto. Ele mapeia o estado atual, a arquitetura RBAC (Role-Based Access Control) recomendada com RLS (Row Level Security) e a sequência atômica de ativação obrigatória **antes** de habilitar as migrations operacionais.

---

## 1. Diagnóstico Sem Afirmações Não Comprovadas

A arquitetura local indica uma ausência de camadas de segurança no banco de dados. As constatações abaixo baseiam-se na análise do código-fonte e do schema atual:

*   **Criação do Cliente Supabase:** O arquivo `src/lib/supabase.ts` inicializa o cliente utilizando a `VITE_SUPABASE_ANON_KEY`, que é pública por design.
*   **Camada de Auth Inexistente no Código:** Não há fluxos de login, verificações de sessão ou `supabase.auth` no frontend do Admin.
*   **Ausência de RLS Local:** Os arquivos `schema.sql` e as migrations locais não contêm comandos `ENABLE ROW LEVEL SECURITY` nem `CREATE POLICY`.
*   **Risco Crítico Provável:** Baseado na infraestrutura local, é altamente provável que o banco remoto aceite leituras e escritas não autenticadas (via anon key) em todas as tabelas.

**Auditoria Obrigatória Pré-Migration:**
A hipótese de "permissão total" não é uma fotografia comprovada do banco remoto, pois os Grants podem divergir. Antes de aplicar qualquer migration de segurança, será executada uma auditoria *read-only* no Supabase para confirmar:
*   `information_schema.role_table_grants`
*   `pg_class.relrowsecurity`
*   `pg_policies`
*   Privilégios de `EXECUTE` das funções.

---

## 2. Decisões Já Aprovadas

As seguintes decisões arquiteturais foram aprovadas e fecham o escopo de segurança para o MVP:

1.  **Login administrativo:** Apenas por e-mail e senha.
2.  **Cadastro público:** Desabilitado. Administradores não podem se auto-registrar.
3.  **Primeiro administrador:** Será criado manualmente pelo Supabase Dashboard.
4.  **Papel único:** O MVP contará exclusivamente com a role `admin`.
5.  **Armazenamento de Roles:** Em tabela separada `public.admin_users`.
6.  **Consumer (Guest):** Continua com leitura pública restrita ao catálogo publicado/ativo.
7.  **Exclusão na Interface:** O Admin usará arquivamento ou desativação. Não haverá hard delete na UI.
8.  **Hard Delete Excepcional:** Realizado somente pelo SQL Editor do Supabase, via procedimento administrativo manual.
9.  **Edge Functions:** Não serão usadas no CRUD comum do MVP.
10. **Service Role:** Nunca será exposta ou embutida no frontend.

---

## 3. Tabela de Roles (public.admin_users)

O controle de quem é administrador ficará restrito a uma tabela fortemente tipada no schema `public`.

**Estrutura Conceitual:**
*   `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
*   `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
*   `created_by UUID NULL REFERENCES auth.users(id)`
*   `is_active BOOLEAN NOT NULL DEFAULT true`
*   `notes TEXT NULL`

**Regras de Segurança:**
*   **RLS habilitado** obrigatoriamente.
*   Sem policy de `SELECT` para anônimos (ninguém além de admins logados pode listar admins).
*   Sem policies de `INSERT`/`UPDATE`/`DELETE` para usuários normais (nem mesmo autenticados).
*   **Bootstrap inicial:** O primeiro registro será inserido diretamente via Supabase Dashboard ou SQL Editor (operando como superuser).
*   **Segregação:** A tabela não armazenará senhas, e-mails ou qualquer credencial duplicada do `auth.users`.
*   O privilégio de administração só é reconhecido se `is_active = true`.

---

## 4. Função `is_admin()`

Para evitar consultar o banco abertamente nas policies e prevenir recursões no RLS, a verificação de role será isolada em uma função segura, estruturada da seguinte forma:

```sql
CREATE FUNCTION public.is_admin()
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
```

**Contrato de Segurança da Função:**
*   Usa exclusivamente `auth.uid()` (não confia em parâmetros do frontend).
*   Não confia no `user_metadata` do JWT (que em certos fluxos pode ser editado pelo usuário).
*   `STABLE`: Otimiza chamadas múltiplas na mesma transação.
*   `SECURITY DEFINER`: Roda com privilégios de quem criou a função (superuser), evitando que o RLS da tabela `admin_users` bloqueie a própria verificação de acesso.
*   `SET search_path = ''`: Previne ataques de injeção e sequestro de schema.
*   Referências (`public.admin_users`) totalmente qualificadas.
*   **Revogação de Execução Pública:** A migration exigirá explicitamente `REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;` e concederá `EXECUTE` minimamente (ex: apenas a `authenticated`). O owner da função deve ser estritamente controlado. A função não servirá de endpoint RPC exposto no Supabase.

---

## 5. Matriz de RLS Corrigida

### Controle de Leitura (Consumer/Guest) e Escrita (Admin)

**DESTINATIONS**
*   **Anon / Authenticated (SELECT):** Apenas quando `is_active = true`.
*   **Admin (SELECT, INSERT, UPDATE):** Permitido.
*   **DELETE:** Sem policy. (Uso de `is_active = false` via UI).

**EXPERIENCES**
*   **Anon / Authenticated (SELECT):** Apenas quando `status = 'published'`.
*   **Admin (SELECT, INSERT, UPDATE):** Permitido.
*   **DELETE:** Sem policy. (Uso de `status = 'archived'` via UI).

**TAGS E PERSONAS**
*   **Anon / Authenticated (SELECT):** Permitido integralmente (são dicionários sem coluna de status).
*   **Admin (INSERT, UPDATE):** Permitido.
*   **DELETE:** Adiado. Depende de análise de restrições de integridade cruzada.

**EXPERIENCE_TAGS E EXPERIENCE_PERSONAS**
*   **Anon / Authenticated (SELECT):** Somente quando a experiência pai possuir `status = 'published'`. (Impede vazamento de drafts cruzando IDs).
*   **Admin (SELECT, INSERT, UPDATE, DELETE):** Permitido (exclusão de vínculos é permitida administrativamente).

**ENGINE_CONFIGS**
*   **Admin-only** por padrão. Não haverá policy pública para anon/authenticated nesta fase.
*   Antes de abrir a leitura ao Consumer, será confirmado no código se ele consome a tabela diretamente.
*   Se o app precisar das regras de Engine, criaremos uma **View** ou **RPC** filtrada e segura no futuro, sem abrir a tabela raiz.

**OPERATING_HOURS E EXCEPTIONS**
*   **Anon / Authenticated (SELECT):** Somente quando a experiência pai possuir `status = 'published'`.
*   **Admin (SELECT, INSERT, UPDATE):** Permitido.
*   **DELETE:** Permitido apenas para apagar blocos operacionais isolados (não para apagar a entidade core).

**TRANSIT_OPTIONS**
*   **Anon / Authenticated (SELECT):** Somente quando `status = 'published'`.
*   **Admin (SELECT, INSERT, UPDATE):** Permitido.
*   **DELETE:** Sem policy normal no MVP. O Admin fará arquivamento (`status = 'archived'`).

---

## 6. Policies de Escrita Seguras

Todas as policies de alteração de estado garantirão proteção granular.
*   **INSERT:** Exigirá `WITH CHECK (public.is_admin())` (controla se os dados novos inseridos são validados pela role).
*   **UPDATE:** Exigirá `USING (public.is_admin())` (impede alteração de linhas se não for admin) e `WITH CHECK (public.is_admin())` (impede que o resultado do update passe para um estado proibido).
*   **DELETE** (quando ativado para vínculos/tabelas auxiliares): Exigirá `USING (public.is_admin())`.
*   Todas as policies de escrita serão limitadas com a cláusula explícita `TO authenticated` — impedindo avaliação desnecessária de conexões `anon`.
*   **Aviso:** O PostgreSQL combina múltiplas policies de uma mesma operação através de `OR`. Deve-se evitar a criação de múltiplas policies permissivas sobrepostas para evitar brechas.

---

## 7. Contrato de Grants

O RLS bloqueia o acesso às linhas (Rows), mas os **Grants** bloqueiam o acesso aos objetos do banco. Um privilégio amplo não substitui a necessidade de policy, mas uma policy sem grants não funciona. A migration de segurança revisará:

*   **SELECT:** Concedido para `anon` e `authenticated`.
*   **INSERT / UPDATE / DELETE:** Concedidos explicitamente a `authenticated` (bloqueando no nível do objeto para a role `anon`).
*   **EXECUTE:** Revogado de `PUBLIC` em funções críticas e concedido seletivamente a `authenticated` ou `service_role`.
*   **SEQUENCES / TIPOS:** Privilégios de `USAGE` ajustados para as roles corretas.
*   Qualquer privilégio desnecessário da Data API que viole este contrato será alvo de `REVOKE`.

---

## 8. Plano de Implementação (Ativação Atômica)

Para garantir zero quebra de acesso e impedir janelas de vulnerabilidade onde tabelas fiquem sem RLS com as novas policies ativas (ou bloqueadas pela ausência delas), a sequência será:

*   **S1A** — Contrato e migration de identidade administrativa (SQL redigido, mas *ainda não aplicado*).
*   **S1B** — Implementação da tela de login, rotas protegidas e contexto de sessão de Auth no frontend.
*   **S1C** — Criação manual do primeiro administrador no Supabase Auth (Dashboard).
*   **S1D** — Migration de RLS, grants e policies completamente redigida e revisada em transação SQL `BEGIN...COMMIT;`.
*   **S1E** — Aplicação controlada e atômica da migração de segurança.
*   **S1F** — Testes imediatos de ataque e regressão:
    *   `anon` lê publicados?
    *   `anon` falha ao escrever?
    *   `admin` (logado) lê drafts e escreve?
    *   `engine_configs` blindada contra leitura pública?
    *   Soft-delete (arquivamento) funciona?
*   **(Ponto de Aborto)**: Se S1F falhar, rollback manual/migration down ou conserto de policy imediato antes de prosseguir.
*   **S2** — Aplicação das migrations operacionais do Bloco 2A.1 (commit `70913f6` — Horários e Transportes).
*   **S3** — Geração de Tipos e ajuste nos Repositories (uso de JWT auth e novos campos).
*   **S4** — Desenvolvimento da Interface Operacional do Admin (UI).

---

## 9. Plano de Recuperação (Disaster Recovery)

Se o Admin sofrer *lockout* (acesso bloqueado), as seguintes ações emergenciais (sem usar desativação de RLS) serão tomadas:

1.  **Administrador Excluído/Desativado:** Um superuser (via SQL Editor no painel da Supabase) executará um `UPDATE public.admin_users SET is_active = true WHERE user_id = <UUID>;`.
2.  **Função `is_admin()` Falha:** Uma migration compensatória será lançada ou o SQL de reparo será executado manualmente via SQL Editor, usando sintaxe idempotente `CREATE OR REPLACE FUNCTION`.
3.  **Policy Defeituosa:** A remoção (`DROP POLICY`) ou recriação ocorrerá via script seguro executado por administrador externo (Dashboard Supabase), e o script será arquivado no repositório.
4.  **Desativação Permanente do RLS:** É expressamente proibida como medida paliativa de recuperação.
5.  **Grants Inconsistentes:** Um script de readequação de `GRANT`/`REVOKE` será usado para restabelecer a base padrão do Supabase para as roles de sistema.

Todos os scripts críticos de recuperação devem ser documentados em pasta apartada do frontend e não devem conter credenciais em plain text.

---

## 10. Pendências Futuras

Apenas as seguintes decisões menores estão postergadas para análise pós-MVP:
1.  Necessidade de um papel limitado de *Editor* (apenas edição, sem publicação).
2.  Necessidade de Edge Functions para operações altamente destrutivas/sensíveis.
3.  Implementação de uma View segura para o Consumer consultar `engine_configs` se comprovada a exigência técnica de leitura dinâmica no front.
