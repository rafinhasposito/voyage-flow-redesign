# Auditoria TRIP-READY V1 e Plano de Ação (Conta do Viajante)

## 1. Auditoria Funcional B2C Atualizada

O aplicativo atualmente foca numa exploração de experiências (Catálogo e Swipe), mas não possui a infraestrutura básica para suportar um usuário B2C (Consumer) persistente. 

| Funcionalidade | Status | Arquivos / Tabelas / Observações |
| :--- | :--- | :--- |
| **Auth Consumer** | **NÃO EXISTE** | Não há `AuthContext` ou provedor para o Viajante. Apenas o AdminAuth existe. |
| **Cadastro** | **NÃO EXISTE** | Nenhuma página de `SignUp` no B2C. |
| **Login** | **NÃO EXISTE** | Nenhuma página de `SignIn` no B2C. |
| **Recuperação de sessão** | **NÃO EXISTE** | Nenhuma lógica para recuperar `supabase.auth.getSession()` no Consumer. |
| **Logout** | **NÃO EXISTE** | Não há botão ou ação de sair para o viajante. |
| **Proteção de rotas** | **NÃO EXISTE** | `/app/board` e `/onboarding` são abertas a qualquer visitante. |
| **Minhas Viagens** | **NÃO EXISTE** | Não existe tela para listar viagens criadas. |
| **Criação de viagem** | **FUNCIONA PARCIALMENTE** | Pula a definição de destino e datas, salvando direto no `localStorage`. |
| **Persistência no banco** | **NÃO EXISTE** | Não existem tabelas B2C de `trips` ou `profiles` no schema remoto atual. |
| **Propriedade por usuário** | **NÃO EXISTE** | Como tudo está no cache do navegador, a viagem não pertence a uma conta. |
| **Recuperação noutro login** | **NÃO EXISTE** | Como é `localStorage`, não sobrevive à troca de celular/computador. |
| **Mobile** | **FUNCIONA PARCIALMENTE** | Classes Tailwind de responsividade existem, mas o fluxo completo não foi testado com auth real. |

---

## 2. Inventário: O que já existe para Reuso

Para evitar duplicidade, investigamos a infraestrutura B2C atual:
- **Provider de Auth Consumer:** Ausente. O arquivo `src/contexts/AdminAuthProvider.tsx` isola o Supabase Auth para o B2B, não deve ser misturado.
- **Chamadas a `supabase.auth` B2C:** Ausentes.
- **Rotas Protegidas:** Nenhuma no B2C.
- **Estruturas de Viagem Existentes:** Há interfaces ricas em `src/utils/travelState.ts` (`TripContext`, `ItineraryDay`), mas elas não mapeiam para um banco SQL, e sim para JSON em cache.
- **Tabelas Relacionadas:** A base real tem `experiences`, `personas`, `tags`, etc (tudo leitura pública). **Não existe** tabela de viagens (`trips`) nem perfis (`profiles`).
- **Persistência atual:** Exclusivamente no navegador via `localStorage` (método `saveTravelState` em `travelState.ts`).

---

## 3. Primeira Entrega Funcional Desta Rodada

**Alteração em `Index.tsx` e Validação:**
A página inicial (`Index.tsx`) foi refatorada. Anteriormente, estava engessada exibindo mocks de `getStoredAttractions()`.
- **Resultado da alteração:** O componente agora consome diretamente `ExperienceRepository.getAll()` com um `useEffect`. 
- **Mapeamento:** Adicionamos o mapeamento explícito (transformando de `ExperienceRow` para a interface `Attraction` exigida pelos cards). 
- **Quantidade real:** Carrega as 107 experiências já cadastradas no banco real.
- **Comportamento seguro:** O loading inicial é silencioso (array vazio inicial) e falhas no Supabase apenas loggam o erro no console sem quebrar a tela inteira, garantindo robustez. 

---

## 4. Necessidade de Migration Exclusiva (B2C Trip Foundation)

Como constatado, o banco atual não tem tabelas para suportar o Viajante. O módulo "comercial" (ADMIN-2B) foi congelado, então precisamos de uma fundação leve e separada exclusivamente para o TRIP-READY.

Foi criada uma candidata em `supabase/migration_candidates/20260721000000_trip_ready_foundation.sql` (disponível para revisão) contemplando:
1. `profiles`: vinculada ao `auth.users` via RLS.
2. `trips`: pertence a um usuário, armazena destino, hotel e datas.
3. `itinerary_days`: os dias associados a uma viagem.
4. `trip_experiences`: as atividades fixadas no roteiro, apontando (com integridade) para as 107 `experiences` reais.
*Esta migration atende rigorosamente ao requisito de RLS e privacidade por usuário.*

---

## 5. PLANO CORRIGIDO (4 BLOCOS)

### BLOCO 1 — CONTA REAL E MINHAS VIAGENS
Criar a fundação B2C que falta.
- **O que será entregue:** Cadastro de viajante, login, sessão persistente, logout e proteção da rota `/app`.
- **Telas:** Nova página de "Minhas Viagens" (estado vazio e listagem das viagens existentes).
- **Ação:** Permitir que o viajante crie uma conta e inicie um login seguro.

### BLOCO 2 — CRIAR E SALVAR MINHA VIAGEM
Substituir o modelo efêmero pelo banco de dados (usando a nova migration).
- **O que será entregue:** Modal/Formulário para definir Destino, Datas, Hotel (Basecamp), Companhia, Ritmo e Orçamento.
- **Ação:** Salvar os dados na tabela `trips` associada ao `user_id` e redirecionar para o Swipe de forma segura. Não mais apenas no `localStorage`.

### BLOCO 3 — ROTEIRO REAL E EDITÁVEL
Acoplar a viagem persistente ao Motor Inteligente (Engine).
- **O que será entregue:** Gerar o roteiro (salvando em `itinerary_days` e `trip_experiences`), mantendo a capacidade de arrastar, excluir e recalcular preservando compromissos fixos e hotel.
- **Ação:** O recálculo agora deve atualizar não apenas o estado local, mas também enviar as alterações (PATCH) ao Supabase para que a viagem não seja perdida.

### BLOCO 4 — MAPA, MOBILE E TESTE DE VIAGEM
O pacote final para rua.
- **O que será entregue:** Implementação de um mapa (com *MapLibre* + *OpenFreeMap* — que é o padrão de arquitetura do projeto) exibindo o Basecamp e os pins diários.
- **Testes Práticos:** Teste de login/logout, leitura funcional do CSS no celular, recuperação em outro dispositivo (mesma conta), e bloqueio explícito a dados de terceiros.

---

## 6. Percentual Real do TRIP-READY V1 e Lacuna Técnica

**Percentual atual: 10%** 
(Estávamos em 35% avaliando apenas a UI e Algoritmo, mas sem a camada fundamental de Conta/Autenticação/Banco, a entrega de Produto Real cai para 10%).

**Menor lacuna técnica para Login + Minhas Viagens (Bloco 1):**
1. Instalar o provedor `@supabase/supabase-js` em um novo `ConsumerAuthProvider.tsx`.
2. Criar a tela `/login` e `/signup` simples com e-mail/senha.
3. Aplicar a migration `20260721000000_trip_ready_foundation.sql` (no Docker local) para liberar o acesso B2C e as RLS.
4. Criar a tela `/app/trips` ("Minhas Viagens") usando os hooks do auth.
