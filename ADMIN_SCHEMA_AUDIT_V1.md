# Auditoria Probatória do Schema, Segurança e Integrações (ADMIN_SCHEMA_AUDIT_V1.md)

Este documento apresenta o resultado da auditoria solicitada para o projeto Voyage Flow. Através de requisições exploratórias à REST API remota do Supabase e análise dos arquivos locais de migração, estabelecemos conclusões preliminares sobre o banco de dados e a segurança atual. Nenhuma alteração de código ou banco de dados foi realizada durante este processo.

---

## 1. Resumo Executivo
*   **Descoberta 1 (Crítica - Comprovada): O Banco Remoto foi modificado fora do Git.** As colunas `type`, `tags`, `personas`, `climate` e `ideal_companion` **existem fisicamente no banco remoto** da Supabase como colunas de array ou string. O arquivo local `supabase/schema.sql` e as `migrations` (000000-000006) estão defasados em relação à produção.
*   **Descoberta 2 (Crítica - COMPROVADA): A Segurança (RLS) das tabelas possui vazamento crítico.** A auditoria remota revelou que `destinations` e `experiences` possuem RLS habilitada, mas contam com **policies e grants escancarados** permitindo SELECT, INSERT, UPDATE, DELETE incondicionalmente (`true`) para `anon` e `authenticated`. A base está altamente vulnerável a inserções e edições anônimas não autorizadas.
*   **Descoberta 3 (Comprovada): Valores de IA "50%" inventados no Frontend.** A UI atual não salva o `50%` no banco. Ela usa a função `normalizeScale` em `src/repositories/ExperienceRepository.ts` (linha 146) que força a devolução de `0.5` caso o dado real venha ausente. 
*   **Descoberta 4 (Comprovada): Importador com hardcodes severos.** A página `src/pages/admin/Import.tsx` injeta metadados de forma fixa e agressiva (`JSON.stringify` na `short_description`, `destination_id` fixo, `energy_level: 'medium'`).
*   **Descoberta 5 (Comprovada): Migrations 000001 a 000005 aguardam equalização.** Não podem ser aplicadas com segurança enquanto o banco remoto não for submetido a uma reconciliação formal do schema.

---

## 2. Matriz Banco Remoto versus Schema Local (Tabela `experiences`)

Resultados baseados na assinatura REST e script de read-only probe:

| Coluna | Existe no Remoto? | Tipo Remoto | Existe no schema.sql / Migration Local? | Existe no supabase.types.ts? | Usada Admin/Engine? | Status / Risco |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **`type`** | Sim | String | 🚨 Não | Sim | Sim (Filtros, Tabs) | **Divergência Grave**. Criado fora do Git. |
| **`category`** | Sim | String | Sim | Sim | Sim | OK. |
| **`tags`** | Sim | Array `[]` | 🚨 Não (M:N em schema) | Sim (`string[]`) | Sim | **Divergência Crítica**. Schema manda usar relação N:N. |
| **`personas`** | Sim | Array `[]` | 🚨 Não (M:N em schema) | Sim (`string[]`) | Sim | **Divergência Crítica**. (Vide `tags`). |
| **`ideal_companion`**| Sim | Array `[]` | 🚨 Não | Sim | Sim | **Divergência Grave**. |
| **`climate`** | Sim | Array `[]` | 🚨 Não | Sim | Sim | **Divergência Grave**. |
| **`intelligence_metadata`**| Sim | JSONB | Sim (Mig 000000) | Sim | Sim | OK. Armazena scores. |
| **`destination_id`** | Sim | UUID | Sim | Sim | Sim | OK. Hardcoded no Import.tsx. |
| **Operacionais (duração, etc)** | 🚨 Não | - | Sim (Mig 000002) | Não | Não | OK. Aguardando aplicação controlada. |

---

## 3. Estado das Migrations (000001 a 000006)

*   **`000001_add_destination_country_code.sql`**: (Não Aplicada). Adiciona country_code, region, timezone na destination.
*   **`000002_add_experience_operational_fields.sql`**: (Não Aplicada). Adiciona duração máxima, filas, booking_deadline.
*   **`000003_create_operating_hours.sql`**: (Não Aplicada). Tabela relacional nova.
*   **`000004_create_operating_hour_exceptions.sql`**: (Não Aplicada). Tabela relacional nova.
*   **`000005_create_transit_options.sql`**: (Não Aplicada). Tabela relacional nova.
*   **`000006_create_admin_identity.sql`**: (**Aplicada**). Cria `admin_users` e `public.is_admin()`.

> **Nota sobre a Migration 000000:** Já existe. Qualquer futura migration de reconciliação de `type/tags` deverá usar um timestamp novo e único, posterior à `000006`.

---

## 4. Estado Real da Segurança (Auth, RLS e `is_admin()`)

*   **Supabase Auth:** Funcionando.
*   **Tabelas `admin_users`, `admin_roles` e `public.is_admin()`:** Existem e estão seguras. A função `is_admin()` é Security Definer.
*   **Frontend (Verificação):** O projeto **não usa** a API RPC ou query em `public.is_admin()` para fechar a navegação (`React Router`). Valida-se apenas a presença de sessão global.
*   **RLS por Tabela (Base de Dados): COMPROVADO - VULNERÁVEL**. Há grants explícitos na tabela de `experiences` e `destinations` para os papéis `anon` e `authenticated` cobrindo (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES). As policies atuais dão sinal verde incondicional (`true`) para essas operações, permitindo destruição/inserção de dados sem credenciais administrativas.
*   **Correção de RLS:** Um script Hotfix (`20260714200000_lock_catalog_rls.sql`) foi preparado, mas **ainda não aplicado**.

---

## 5. Diagnóstico da Persistência da IA (IA Concierge)

**Status: Comprovado.**
A Engine atual não registra pesos nulos visualmente.
No arquivo `src/repositories/ExperienceRepository.ts` (linhas 146-152):
```typescript
const normalizeScale = (value: number | undefined | null): number => {
  if (value === undefined || value === null) return 0.5; // Default safe value
  // ...
};
```
Isso produz a aparência falsa de "50%".

---

## 6. Diagnóstico do Importador por URL (`Import.tsx`)

**Status: Comprovado.**
A página `src/pages/admin/Import.tsx` dispara extrações e manipula os campos de forma agressiva antes do `INSERT`. 

Linhas exatas de intervenção em `handleSave` (linhas 101-124):
*   **`destination_id` hardcoded:** Linha 102: `destination_id: NYC_DESTINATION_ID`
*   **`short_description` recebe JSON:** Linhas 107-112:
    ```typescript
    short_description: JSON.stringify({
      tags: exp.tags || [],
      rating: exp.rating || null,
      reservation_required: exp.reservation_required || false,
      is_must_see: exp.is_must_see || false,
    }),
    ```
*   **Fallbacks fixos de energia e localização:**
    *   Linha 121: `energy_level: 'medium'`
    *   Linha 122: `indoor_outdoor: 'outdoor'`

---

## 7. Riscos e Reclassificação de Conclusões

*   **Comprovado (Divergência):** `type`, `tags` e arrays paralelos no banco remoto existem sem constar no `schema.sql`.
*   **Comprovado (RLS):** `destinations` e `experiences` estão vulneráveis à escrita não autorizada. Políticas públicas abertas (`true`) e grants desnecessários (TRUNCATE, TRIGGER, REFERENCES) constam nas tabelas. A correção ainda não foi aplicada.
*   **Comprovado (Front-end):** Importador tem hardcodes graves. Fallback de IA 50% é estética no frontend.

---

## 8. Sequência Segura Recomendada (Fases A a F)

A adoção de novas arquiteturas seguirá a seguinte ordem:

*   **FASE A — CAPTURA DO ESTADO REMOTO** (Finalizada via auditoria read-only).
*   **FASE B — HOTFIX DE RLS (Em andamento)**
    *   Aplicar o arquivo `20260714200000_lock_catalog_rls.sql` para sanar a vulnerabilidade crítica nas permissões das tabelas.

*   **FASE C — RECONCILIAÇÃO DO SCHEMA VERSIONADO**
    *   Criar futura migration incremental e idempotente.
    *   Registrar colunas remotas ausentes no Git (`type`, `tags`, etc).

*   **FASE D — AUTORIZAÇÃO DO FRONTEND**
    *   Chamar `public.is_admin()` no roteamento.
    *   Bloquear usuário autenticado não-admin de acessar interfaces do Admin.

*   **FASE E — MIGRATIONS OPERACIONAIS**
    *   Revisar e aplicar `000001` a `000005` individualmente, sempre testando.
