# Plano de Validação: Hotfix de RLS do Catálogo

Este plano garante que a migration de hotfix cumpriu o seu objetivo de fechar o vazamento de segurança nas tabelas `destinations` e `experiences` sem bloquear o sistema, removendo a exclusão definitiva e introduzindo exclusão por arquivamento.

---

## 1. Testes de Visitante Anônimo (Não autenticado)
Estes testes verificam se a chave `anon` do Supabase está corretamente restrita à leitura de conteúdo publicado.

- [ ] **Leitura de Experiências (Público):** Fazer GET em `experiences`. Deve retornar exatamente as 107 experiências publicadas.
- [ ] **Leitura de Experiências (Rascunho):** Tentar fazer GET filtrando por um ID onde `status = 'draft'`. A API deve retornar `0` linhas (não autorizado ou não encontrado).
- [ ] **Leitura de Destinos:** Fazer GET em `destinations`. Deve retornar exatamente o 1 registro atual onde `is_active = true`.
- [ ] **Tentativa de Inserção:** Tentar disparar um POST para `experiences` ou `destinations`. **Deve falhar**.
- [ ] **Tentativa de Atualização (UPDATE):** Tentar um PATCH em um ID conhecido. **Deve falhar**.
- [ ] **Tentativa de Exclusão (DELETE):** Tentar um DELETE. **Deve falhar**.

---

## 2. Testes de Consumidor (Usuário Autenticado, Não-Admin)
Estes testes verificam se usuários logados no aplicativo Voyage Flow (Consumer) não ganharam privilégios de administrador por tabela.

- [ ] **Tentativa de Inserção:** Disparar POST para `experiences`. A function `is_admin()` retornará `false` e o INSERT **deve falhar**.
- [ ] **Tentativa de Atualização:** Disparar PATCH. O UPDATE **deve falhar**.
- [ ] **Tentativa de Exclusão:** Disparar DELETE. **Deve falhar**.
- [ ] **Leitura de Experiências (Rascunho):** O Consumer (sem admin roles) NÃO DEVE visualizar o rascunho. 
- [ ] **Leitura após Publicação:** O Consumer deve passar a visualizar o registro apenas após o Admin alterá-lo para `status = 'published'`.

---

## 3. Testes de Administrador (Autenticado + Ativo na admin_users)
Estes testes garantem que o Dashboard do Admin continuará funcional para gestão do ciclo de vida dos dados.

- [ ] **Leitura Irrestrita (Experiences):** O Admin acessa `/admin/experiences`. Ele deve conseguir ver os rascunhos criados, independentemente de `status` ser `'draft'` ou `'published'`.
- [ ] **Criação de Rascunho (INSERT):** O Admin preenche o form e salva uma nova experiência como rascunho. A inserção deve ter **sucesso**.
- [ ] **Visualização do Rascunho:** Confirmar que o Admin consegue visualizar o rascunho recém-criado.
- [ ] **Edição / Publicação (UPDATE):** O Admin edita a experiência rascunho para `status = 'published'` e salva. A atualização deve ter **sucesso**.
- [ ] **Exclusão Definitiva (DELETE Bloqueado):** O Admin dispara um DELETE (se tentar contornar a UI). O comando **deve falhar** na base de dados para o próprio Admin, garantindo que não há exclusão definitiva.
- [ ] **Arquivamento Logico:** Validar o arquivamento das entidades mudando o `status` (experiences) para 'archived/draft' ou `is_active` (destinations) para false ao invés de usar `DELETE`.

---

## 4. Testes do Importador por URL (Integração)
Estes testes verificam se a Edge Function ou o fluxo de importação não foi quebrado.

- [ ] **Acesso da Edge Function:** O cliente (Admin) submete os dados raspados usando sua própria sessão. Deve funcionar normalmente porque a condição `is_admin() = true` é satisfeita no `INSERT`.
- [ ] **Criação via Importador:** Realizar o fluxo de importação e confirmar que o novo registro aparece na grid corretamente.
