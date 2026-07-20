# Homologação Física do SQL B2B (ADMIN-2B.1B)

Este pacote contém os artefatos para a validação física do SQL da fundação administrativa antes de sua aplicação definitiva.

Como o ambiente não possui Docker local e o banco de dados oficial **id\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*** NUNCA deve ser usado como ambiente de teste, documentamos duas opções de execução futura:

## Opção Principal: Ambiente PostgreSQL/Supabase Local
*(Quando Docker for instalado/habilitado na máquina hospedeira)*

1. Subir infraestrutura local: `npx supabase start` (ou container cru via `docker run`).
2. Preparar schema mínimo (Auth): Executar o stub em `supabase/tests/admin_backend_foundation_setup.sql` via psql.
3. Executar candidata localmente: Injetar `supabase/migration_candidates/20260720080000_admin_backend_foundation.sql`.
4. Verificar existência das 9 tabelas.
5. **Teste de Idempotência**: Executar a candidata uma segunda vez sem erros.
6. **Assertions**: Executar `supabase/tests/admin_backend_foundation_test.sql`. As 15 exceptions preparadas não devem disparar.
7. Validar RLS simulando chaves de API (`anon`, `authenticated`, `service_role`).
8. Testar roteamento CORS da Edge Function via CLI `npx supabase functions serve admin-list-users`.

## Opção Alternativa: Projeto Supabase Descartável
*(Se Docker continuar indisponível)*

1. Criar um projeto Supabase Cloud 100% separado do projeto real.
2. Não há necessidade de setup manual do Auth, pois o Cloud já possui schema `auth`.
3. Executar a candidata pelo painel SQL Editor do projeto descartável.
4. Validar visualmente as 9 tabelas.
5. Re-executar o script pelo painel para provar idempotência (Blocos `DROP POLICY IF EXISTS`).
6. Executar o script `admin_backend_foundation_test.sql` no painel. Se nenhuma exception estourar, as 15 assertions passaram.
7. Testar policies via interface RLS do Supabase Studio.
8. (Opcional) Fazer deploy da Edge Function para este projeto descartável para checar CORS e Auth de ponta a ponta.
9. **MANDATÓRIO**: Apagar o ambiente descartável inteiro após gerar o relatório de sucesso.
