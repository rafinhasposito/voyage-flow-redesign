# S1C: Preparação e Validação do Primeiro Administrador

Este documento estabelece o procedimento seguro e objetivo para a aplicação da migration de identidade administrativa e a criação manual (bootstrap) do primeiro administrador do Voyage Flow.

---

## 1. Pré-condições

- **Branch:** `feature/restauracao-admin-completo`
- **Commits necessários:** `1359e23` ou posterior contendo o plano de segurança e a base Auth S1B.
- **Backup:** Snapshot recomendado do banco de dados antes da aplicação (Database > Backups > Create manual backup).
- **Acesso:** Painel de controle do Supabase com permissão de Owner.
- **Confirmação:** URL do projeto e ID conferidos no Dashboard.
- **Estado Local/Remoto:** A migration `000006` ainda NÃO foi aplicada no banco alvo.
- **Segurança:** NENHUMA credencial (e-mail, senha, UUID) deve ser incluída neste documento, em repositório Git ou chat da IA.

---

## 2. Auditoria Read-Only Pré-Aplicação

Execute o seguinte SQL no **SQL Editor** do Supabase para verificar o estado atual. O resultado deve ser vazio ou apontar ausência da tabela/função alvo.

```sql
-- 1. Verifica existência da tabela admin_users
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'admin_users'
);

-- 2. Verifica existência da função is_admin()
SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
);
```

---

## 3. Aplicação da Migration 000006

A aplicação deve ser feita de forma controlada através do **Supabase SQL Editor** e não via CLI global, para evitar a aplicação prematura das migrations operacionais (000001 a 000005).

### Procedimento
1. Abra o arquivo local: `supabase/migrations/20260713000006_create_admin_identity.sql`.
2. Certifique-se de que não existem instruções `INSERT` para usuários neste arquivo.
3. Certifique-se de que não há declaração de `POLICY` para outras tabelas.
4. Copie todo o conteúdo.
5. No Supabase Dashboard, vá para **SQL Editor** > **New query**.
6. Cole o conteúdo e clique em **Run**.

### Auditoria Pós-Aplicação

Execute o seguinte bloco para confirmar as permissões e criação:

```sql
-- Confirmar que o RLS está ativo na admin_users (relrowsecurity = true)
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'admin_users';

-- Confirmar grants de execução apenas para 'authenticated' e nulo para 'anon' (se houver revoke)
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'is_admin' AND routine_schema = 'public';
```

---

## 4. Criação Manual do Usuário

No Supabase Dashboard:

1. Acesse **Authentication** > **Users**.
2. Clique em **Add user** > **Create new user**.
3. Preencha o e-mail (e-mail de administrador real, interno ao domínio se houver restrição) e digite uma senha forte e complexa (MÍNIMO 12 caracteres recomendados).
4. **Auto Confirm User?** Deixe ativado/marcado (se o e-mail não exigir confirmação real na fase de dev/homologação) ou siga o fluxo do ambiente.
5. Salve o usuário.

*Atenção: Não habilite rotas públicas de SignUp para administradores nas configurações gerais de Auth.*

---

## 5. Obtenção do USER_ID

Ainda na tela **Authentication** > **Users**:
1. Localize o usuário recém-criado.
2. Clique no ícone de cópia ao lado da coluna **User UID**.
3. Guarde esse UUID provisoriamente na memória temporária (Clipboard). O formato será semelhante a `123e4567-e89b-12d3-a456-426614174000`. Não versionar esse UUID.

*No restante deste guia, usaremos o placeholder visual: `<USER_ID_DO_ADMIN>`.*

---

## 6. Inserção do Primeiro Admin (Bootstrap)

No **SQL Editor** do Supabase, crie uma nova query para inserir este usuário como Administrador Ativo:

```sql
INSERT INTO public.admin_users (
  user_id,
  created_by,
  is_active,
  notes
)
VALUES (
  '<USER_ID_DO_ADMIN>',
  NULL,
  true,
  'Administrador inicial criado manualmente'
)
ON CONFLICT (user_id) DO NOTHING;

-- Confirmar se a inserção teve sucesso e se o usuário está ativo
SELECT user_id, is_active, notes
FROM public.admin_users
WHERE user_id = '<USER_ID_DO_ADMIN>';
```

Se a query de confirmação retornar vazio, o UUID provavelmente estava errado. Se retornar `is_active = false`, **não reative automaticamente**. Exija uma decisão manual explícita pelo SQL Editor para atualizar a flag `is_active` para `true`.

**Nota:** Substitua `<USER_ID_DO_ADMIN>` pelo UUID copiado do painel. Após o `Run`, feche e descarte a aba para não deixar rastros do UUID atrelado a e-mails.

---

## 7. Validação SQL do Admin

Valide se a identidade administrativa foi devidamente consolidada e obedece ao RLS via consultas (utilize o usuário postgres via painel):

```sql
-- Verifica se o registro existe e se a foreign key está íntegra
SELECT a.user_id, u.email, a.is_active
FROM public.admin_users a
JOIN auth.users u ON a.user_id = u.id;
```

O resultado não revelará senhas. As regras do RLS padrão também protegerão a leitura vinda dos clientes.

---

## 8. Validação da Função `is_admin()`

A função `public.is_admin()` exige Claims JWT que injetam o `auth.uid()` durante a execução, o que não pode ser forjado facilmente de forma segura no SQL Editor bruto pelo usuário `postgres`.

**Estratégia Recomendada:**
Validação direta pelo Frontend (Estratégia A). Ao fazer o login real na aplicação cliente local, o SDK do Supabase instanciará as credenciais corretas. O teste da autorização acontecerá na etapa S1D.

---

## 9. Validação Real do Login

Execute localmente (`npm run dev`) e siga o Checklist:

- [ ] Abrir `http://localhost:5173/admin/login` (ou a porta local em uso).
- [ ] Inserir e-mail e senha do administrador recém-criado.
- [ ] Confirmar botão de "Loading...".
- [ ] Confirmar o redirecionamento imediato para `/admin`.
- [ ] Atualizar a página e verificar se a sessão é recuperada sem passar pelo login.
- [ ] Acessar rotas profundas (ex: `/admin/users` ou `/admin/experiences`) e validar retenção do layout administrativo.
- [ ] Clicar no botão "Sair" na sidebar inferior.
- [ ] Confirmar redirecionamento automático de volta a `/admin/login`.
- [ ] Tentar login com senha incorreta e validar exibição exata de `E-mail ou senha inválidos.` sem indicar enumeração de contas.
- [ ] Confirmar, em aba anônima, que a rota Consumer raiz `/` e o catálogo permanecem visualmente acessíveis.

*Nota técnica: No S1C, o Frontend (S1B) valida apenas **se existe sessão autenticada** e não chama `is_admin()`. A validação final e segura ocorrerá na Etapa S1D.*

---

## 10. Teste de Usuário Não-Admin

**Status Atual:** Enquanto o passo S1D não ligar a função `is_admin()` à lógica de frontend (e proteção de RLS via Policies), qualquer conta comum (Consumer) criada conseguirá teoricamente passar da tela `/admin/login`.

**Regra Estrita de Segurança:**
Não crie usuários "Mock", "Teste" ou de "Consumidor Comum" neste momento.

**Critérios de Saída do S1C:**
1. Migration 000006 aplicada.
2. Primeiro e único administrador registrado na `auth.users` e `public.admin_users`.
3. Login frontend opera ciclos (in/out) e sessão retida.
4. Senhas e e-mails totalmente ausentes no Git e documentação.

---

## 11. Plano de Aborto (Rollback)

Se algo der errado na aplicação ou bootstrap:
- **Falha de Migration:** Se a migration falhar, interromper e registrar o erro.
- **Reversão Automática:** Se a transação tiver sido revertida automaticamente, confirmar o estado com queries read-only.
- **Aplicação Parcial:** Se houver aplicação parcial, corrigir com migration compensatória revisada.
- **Preservação de Dados:** Não apagar `admin_users` se já houver administrador registrado.
- **Dependências:** Não apagar `public.is_admin()` sem verificar dependências em `pg_depend`.
- **Ações Destrutivas:** Qualquer remoção estrutural exige backup, auditoria de dependências e aprovação explícita.
- **Erro de Credencial:** Para erro de usuário ou e-mail, corrigir ou remover somente o usuário criado incorretamente pelo Dashboard. Não apagar a tabela ou função por causa de erro de credencial.
- **Não remova RLS:** Nunca desativar RLS permanentemente. Em vez disso, cheque as regras do JWT.

---

## 12. Próximo Passo

Após confirmar os Critérios de Saída do S1C, **inicie a Etapa S1D**:
- Conectar a função `public.is_admin()` ao contexto do Frontend (`AdminAuthContext`).
- Atualizar a rota `ProtectedAdminRoute` para rejeitar e deslogar sessões ativas que não retornem true de `is_admin()`.
- Preparar a RLS transacional do Catálogo antes das migrations operacionais do S2.
