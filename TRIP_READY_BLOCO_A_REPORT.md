# Trip Ready (Bloco A) - Report Oficial

### Status Atual de Validação Remota (Bloco A.2G concluído):

- Migration Consumer — Aplicada
- Tabelas Consumer — Criadas
- Login Consumer — Validado
- Profile Consumer — Funcional (UPSERT Idempotente)
- Criação de viagem — Funcional (RLS Insert habilitado + FK Check resolvido)
- Minhas Viagens — Conectada
- Logout e novo login — Validados
- Recuperação da viagem — Validada
- Isolamento remoto com segunda conta — Pendente (Aguardando liberação de rate limit de e-mail remoto na nuvem)

## Correções Técnicas Aplicadas
- **Criação de Profile:** Implementado `ProfileRepository.ensureCurrentUserProfile()` no frontend (ConsumerAuthProvider e TripRepository) operando com UUID mapeado do `auth.users`. Evita o RLS Block anterior (que ocorria por falha da FK de viagens não achar o pai no profile).
- **Migration Incremental:** `20260721000001` aplicou RLS explícita `WITH CHECK (auth.uid() = id)` e liberou Policy `Users can insert own profile`.
- Bloco B — Próximo: novo Onboarding Concierge
- **Tabela Trips Policy Violation (`42501`)**: O RLS de `trips` barrou a inserção de teste. A causa reside no fato de que o usuário Autenticado (Auth) não foi criado automaticamente em `public.profiles` via Trigger no banco de dados. E a policy no Supabase remoto restringe inserts sem a devida conformidade FK.
- **Isolamento de Usuários**: Suspenso do teste E2E local. O *Rate Limiter* remoto do Supabase Cloud bloqueou novos envios (erro HTTP 429), conforme previsto como possível risco (validação a ser continuada por SQL autenticada ou conta confirmada em pendência).

A migration oficial B2C foi aplicada com sucesso sem corromper nenhuma tabela existente e sem causar regressão na "Divergência Aladdin" de UUID. O Frontend está preparado para rodar assim que estes reparos da "cola" (Auth Trigger) forem efetivados.
