# Runbook: Aplicação Remota do Backend Foundation (ADMIN-2B.2B)

**Commit de Origem:** `24d43a4`
**Project Ref:** `idcucjpanzufkipvfmse`
**Única Migration Esperada:** `20260720080000_admin_backend_foundation.sql`

## 1. Estado Verificado Pré-Aplicação
- **Backup Criado:** Sim. Diretório local temporário na máquina de desenvolvimento.
- **Hashes dos Backups:**
  - `remote-public-data.sql`: b265c9a321edfefb938ce59ea3c47a95603434588b0076ef7eaece78a9eea200
  - `remote-schema.sql`: a321d77007d1ce8022112ecee62550f768002b919e6360376eb79a2c40849189
- **Contagem de Dados Críticos:**
  - Experiências Totais: 108
  - Experiências Publicadas: 105
  - Admin Users Totais: 2
  - Admin Users Ativos: 2
- **Histórico de Migrations:** Sincronizado. Nenhuma divergência.
- **Resultado do Dry-Run:**
  ```text
  Would push these migrations:
   • 20260720080000_admin_backend_foundation.sql
  ```

## 2. Checklist Pré-Aplicação
- [ ] Garantir que ninguém esteja realizando cadastro manual no Admin CMS.
- [ ] Confirmar que o Git branch atual está limpo e no commit `24d43a4`.
- [ ] Confirmar que a Edge Function `admin-list-users` **NÃO** será deployada nesta etapa de banco.

## 3. Checklist Pós-Aplicação
- [ ] Verificar novamente a contagem de `experiences` no Supabase remoto (deve ser 108).
- [ ] Verificar a criação bem sucedida das 9 tabelas (`system_settings`, `partners`, `affiliate_programs`, `affiliate_links`, `orders`, `order_items`, `payments`, `profiles`, `analytics_events`).
- [ ] Confirmar o acesso da interface `/admin` conectada ao remoto via UI.
- [ ] Validar a leitura e gravação no Catálogo (Roteiros).

## 4. Critérios de Interrupção e Falha
- O `db push` aborta ou retorna código de erro.
- A migration falha por duplicidade ou dependência de `id` legada.
- O painel administrativo B2B fica sem acesso.
- As consultas ao Catálogo do Viajante (B2C) falham ou ficam vazias.

## 5. Plano de Rollback
O rollback **não deve presumir exclusões automáticas ou repair automático**.

1. **Falha de Push:**
   - **NÃO** use `migration repair` automaticamente.
   - Inspecione primeiro o histórico remoto com `supabase migration list --linked`.
   - Não repita o push sem entender a falha detalhadamente.
2. **Falha de Validação (Corrupção estrutural detectada após Push Sucesso):**
   - Bloquear imediatamente o avanço para a fase ADMIN-3.
   - Preparar uma reversão SQL (um arquivo de DOWN migration) separada e rigorosamente revisada para remover as 9 tabelas e policies criadas. NENHUM `DROP TABLE` deve ser executado no console até aprovação do Principal Engineer.
   - Restaurar backup lógico? Somente mediante decisão explícita se os dados de `experiences` ou `admin_users` foram acidentalmente afetados. Se os dados vitais estão intocados, o rollback é estritamente via SQL Down-migration.
   - Não apagar tabelas que já tenham recebido dados novos B2B antes de exportá-los.

## 6. Riscos Restantes
- **CORS / Auth API / Edge Runtime:** A Edge Function `admin-list-users` está explicitamente de fora desta aplicação. O comportamento HTTP real será validado apenas quando o deploy da função ocorrer.
- **Risco Zero:** A migration foi exaustivamente dry-runned, testada contra esquema divergente (usando `user_id` da base real) e foi provado que ela não contém exclusões ou alterações na tabela `experiences`. O risco é baixo.
