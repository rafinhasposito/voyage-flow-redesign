# ADMIN-2B.2A — Remote Preflight Report

## 1. Estado Remoto Atual
- **Vínculo do Projeto**: Confirmado para o projeto `idcucjpanzufkipvfmse`.
- **Acessibilidade**: Banco de dados remoto alcançado com sucesso via `supabase db dump`.
- **Risco Global Imediato**: Nenhuma alteração foi realizada; inspeção puramente em modo de leitura.

## 2. Inventário das 9 Entidades Propostas
A migração candidata prevê a adição/uso de 9 estruturas além da base existente. O levantamento real no banco de dados indicou o seguinte status para cada uma:

| Entidade / Tabela | Status no Banco Real |
| :--- | :--- |
| `system_settings` | NÃO EXISTE |
| `partners` | NÃO EXISTE |
| `affiliate_programs` | NÃO EXISTE |
| `affiliate_links` | NÃO EXISTE |
| `orders` | NÃO EXISTE |
| `order_items` | NÃO EXISTE |
| `payments` | NÃO EXISTE |
| `profiles` | NÃO EXISTE |
| `analytics_events` | NÃO EXISTE |

### A Exceção Crítica: `admin_users`
A tabela `admin_users` **EXISTE INCOMPATÍVEL**.
- **Estrutura Remota Atual**:
  A tabela possui a seguinte estrutura e restrições:
  - `user_id` uuid NOT NULL (PRIMARY KEY)
  - `created_at` timestamp
  - `created_by` uuid
  - `is_active` boolean
  - `notes` text
- **Divergência Grave**: A migration candidata inteira pressupõe que a chave primária de `admin_users` seja `id`. Exemplos na candidata:
  - `updated_by uuid REFERENCES public.admin_users(id)`
  - `EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())`

## 3. Conflitos Encontrados e Divergências de Schema / RLS
1. **O Conflito `user_id` vs `id`**: Como `admin_users` possui a coluna `user_id` em vez de `id`, qualquer instrução SQL na candidata que utilize `REFERENCES public.admin_users(id)` ou busque por `WHERE id = auth.uid()` irá falhar com o erro fatal "column does not exist" no PostgreSQL, abortando a transação.
2. Nenhuma das outras 8 tabelas existe, logo não há colisão de nomes, constraints ou policies antigas para elas.
3. Não foram detectadas outras conflicts diretas com a tabela base de `experiences`.

## 4. Riscos para os Dados Existentes (107 Experiências)
Baixo risco direto para a tabela experiences, mas aplicação remota bloqueada até a compatibilização e nova homologação local.
- A candidate migration não introduz DROP, DELETE ou ALTER table mutáveis em `experiences`.
- Não altera foreign keys existentes em `experiences` de forma destrutiva.
- Como o erro em `admin_users` travaria a migração nos primeiros comandos, o PostgreSQL reverteria a transação (Rollback) automaticamente antes que qualquer dano estrutural ocorresse em outras tabelas.

## 5. Compatibilidade de `profiles`
**Compatível.** A tabela não existe atualmente. O namespace está livre e a estrutura da candidata (utilizando `id` vinculado a `auth.users(id)`) é sólida e não esbarra em nenhuma entidade anterior.

## 6. Compatibilidade da Edge Function
A função `admin-list-users` foi verificada estaticamente.
- **Variáveis**: Está preparada para exigir `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- **CORS e Auth**: Implementa controle de origem (B2B) e repasse de Authorization Header nativo e seguro.
- **Divergência Grave (Crashed on Arrival)**: Na linha 54, a função possui o bloco `...from('admin_users').select('id').eq('id', user.id)`. Como a tabela real usa `user_id`, a API do Supabase recusará a request retornando erro, quebrando a autenticação do admin.

## 7. Mudanças Necessárias na Candidata
Para que a migração e a Edge Function possam ser implementadas no projeto real com sucesso e idempotência, é obrigatório:
1. Substituir todas as menções de `admin_users(id)` por `admin_users(user_id)` na migration candidata.
2. Substituir todas as query RLS de `admin_users WHERE id =` por `admin_users WHERE user_id =`.
3. Atualizar a query do arquivo `index.ts` da Edge Function para `.select('user_id').eq('user_id', user.id)`.

## 8. Plano Exato de Rollback
1. (Preventivo) Como a transação falharia no início, o próprio SQL causará o rollback atômico.
2. (Manual) Caso aplicadas manualmente:
   - `DROP TABLE system_settings, partners, affiliate_programs, affiliate_links, orders, order_items, payments, profiles, analytics_events CASCADE;`
   - Restaurar Edge Function `admin-list-users` caso sobreescrita.

## 9. Recomendação Final
**NÃO APTA.**
A migration não deve ser enviada ao servidor real e nem a Edge Function. A divergência do `user_id` em `admin_users` quebraria instantaneamente as transações de deploy local e remoto, evidenciando uma falha grave nos artefatos da versão atual da candidata.
