# Projeto Voyage - Contexto e Fonte da Verdade

Este documento representa o estado atual do projeto, suas regras arquiteturais e o roteiro de desenvolvimento. Ele deve ser atualizado continuamente ao final de cada fase importante para refletir a realidade do código e as decisões de negócio.

---

## 1. Visão do Produto
- **Objetivo do projeto:** Facilitar e elevar o planejamento de viagens através de roteiros hiper-personalizados baseados em Inteligência Artificial. O sistema realiza um *matching* inteligente entre o perfil do usuário, seus interesses, restrições orçamentárias e o catálogo de atrações do destino.
- **Inteligência Artificial (Motor de Recomendação):** Puramente client-side, utilizando regras matemáticas de afinidade (Tinder-like swipe, personas, acompanhante, orçamento) no `ExperienceMatchingEngine` (via `travelState.ts`). 
- **Restrições Factuais:** A partir da fase EI-7, o motor suporta regras determinísticas absolutas (ex: proibição de crianças em eventos para adultos ou barreira arquitetônica para cadeirantes) através da função `evaluateRestrictions`, combinando bloqueios "hard" que invalidam o Roteiro, com alertas ("warnings") visuais na interface do Consumer (`ExperienceWarning`).
- **Público-alvo:** Viajantes de diversos perfis (solos, casais, famílias, grupos de amigos) que valorizam roteiros bem curados e fogem do esforço manual de pesquisa.
- **Modelo de negócio:** Atração e captação de leads via criação de roteiros de forma totalmente gratuita e sem atritos (sem login inicial). A monetização futura virá, primariamente, através de links de afiliados (como GetYourGuide) integrados de forma nativa e útil nas recomendações.

---

## 2. Arquitetura Atual
- **Ambiente Banco de Dados:** Remote Database (Projeto: `idcucjpanzufkipvfmse.supabase.co`), com migrations totalmente sincronizadas. Histórico reparado para a UI (006, 007, 008) e estruturais pendentes aplicadas (001 a 005, e 20260718200000 - Políticas e Acessibilidade). Ação preservou os 107 registros existentes intactos.
- **Status da CLI:** Ativamente vinculada e sincronizada, protegida de resets.
- **Mapas Oficiais (Map Engine):** MapLibre GL JS + OpenFreeMap. (Nota Histórica: Google Maps e Google Places constam como legado descontinuado devido a custos e lock-in no escopo deste produto, mantendo-se apenas menção em variáveis residuais de migração antiga).
- **Tecnologias utilizadas:** React (Vite), TypeScript, TailwindCSS, Lucide Icons, React Router.
- **Estrutura do frontend:** SPA (Single Page Application) modularizada. Segue uma separação rígida de camadas em `/src`:
  - `pages/` e `components/`: UI pura (Apresentação).
  - `repositories/`: Camada de acesso a dados.
  - `services/`: Serviços auxiliares e orquestração.
  - `utils/` (incluindo a `ExperienceMatchingEngine`): Lógica de negócio e regras matemáticas.
- **Supabase Backend (BaaS):** Autenticação, Banco de Dados (PostgreSQL) e Storage para mídia.
- **Supabase Edge Functions:** 
  - `import-experience`: Importação de atrações (Jina + OpenAI + Google Places).
  - `import-bulk`: Raspagem e extração em lote de blogs (Jina + OpenAI + Google Places).
  - `enrich-catalog`: Worker de Auto-Heal (cura de dados) que detecta metadados faltantes no banco e completa usando a Google Places API.
- **Banco de dados:** PostgreSQL no Supabase, contendo tabelas como `experiences` e `destinations` protegidas por RLS (Row Level Security).
- **Cache:** Serviço local (`CacheManager.ts`) implementado no padrão *Stale-While-Revalidate* (SWR), com versionamento e tempo de vida (TTL) para garantir a melhor performance e carregamento imediato na UI.
- **Engine:** O coração do projeto, `ExperienceMatchingEngine`, é um sistema lógico executado integralmente no frontend que calcula *scores* baseados nos metadados do usuário e nas tags da atração, entregando recomendações dinâmicas e roteirizadas.

---

## 3. Funcionalidades Concluídas
- **O que já está implementado:**
  - **Consumer App:** Landing Page, Onboarding customizado (perfil, bolso, interesses), Dashboard de Roteiro ("Meu Roteiro"), Catálogo interativo de atrações e estimativa de gastos (Wallet). **Redesenhado em Fase 7 com estética Bento Box** (Urbanist, neon-lime `#E2F18A`, cards `rounded-[24-28px]`, canvas `#F0F2F5`). Shared `AppNav` com pills de navegação.
  - **EI-9 (Concluída):** Edição manual com StopEditMetadata, preservação inteligente e substituição focal com validação estrita.
  - **EI-10 (Concluída - Validada):** Experiência Visual do Roteiro. Implementado Drag and Drop nativo HTML5 para desktop (com setas acessíveis para mobile). Modal de substituição com a11y completo (role dialog, trap escape/cliques fora, restore focus). Identidade visual ajustada para lime/mint/slate (sem dourado).
  - **Infraestrutura e Repositório:** Conexão com Supabase via `ExperienceRepository`, orquestração de cache e desacoplamento completo da UI.
  - **Funcionalidades de Negócio:** Suporte ao botão "Coringa" (`is_must_see`) para dar bypass parcial nos filtros rigorosos da Engine e garantir que atrações icônicas sejam recomendadas.
  - **Localização:** Coordenadas exatas (`location_lat`, `location_lng`), bairro, endereço. Gerenciadas via mapas interativos (Google Maps) no Admin.
  - **Custos:** `base_cost` para cálculos de Orçamento Inteligente.
  - **Categorização:** Type (Hotel vs Experience), Category, Tags, Personas, Ideal Companion, Climate.
  - **Vídeo & Mídia:** Suporte a vídeos curtos (`.mp4`, `.webm`) para Live Covers estilo TikTok/Reels na listagem e na capa das atrações.
  - **Painel CMS Interno (Fase 3) e Ingestão de Massa (Fase 5.1):** Painel do time interno para gerenciar catálogo de atrações. Gerenciamento de Rascunhos implementado, permitindo salvar experiências como rascunho (`draft`) e publicá-las em lote diretamente na listagem. Implementação do `smart_scraper` em Node/Puppeteer integrado à Edge Function do Supabase para raspar URLs, injetar Links de Afiliado automaticamente e categorizar experiências estruturalmente (ex: Basecamps/Hotéis vs Atrações).
  - **Importador Automático em Lote (IA):** Tela operacional completa em `/admin/import` integrada à Edge Function `import-bulk` no Supabase. Permite ler artigos de blogs (como dicasnovayork.com.br) ou guias de viagem usando Jina AI Reader, extrair até 15 experiências estruturadas por artigo usando IA (GPT-4o-mini), e permitir gravação em lote seletiva no banco de dados com tratamento de coordenadas e categorias.
  - **Quality Dashboard & Auto-Heal:** Dashboard em `/admin/quality` para monitoramento da saúde do catálogo, que detecta a ausência de campos críticos (GPS, Fotos, Rating, Avaliações, Endereço, Segmentação). Inclui um botão central de *Auto-Completar* que invoca a Edge Function `enrich-catalog` para curar dados incompletos automaticamente via Google Places. Adicionado o botão **Revisar Taxonomia (IA)** (`reframe-taxonomy`) para reenquadrar experiências legadas na nova árvore hierárquica (Tipo -> Categoria).
  - **Módulo de Destaques (Featured Experiences):** Dashboard administrativo (`FeaturedDashboard.tsx`) com identidade visual Bento Box para gerenciar manualmente quais experiências e roteiros ganham destaque na homepage do sistema.
  - **Redesenho Visual do Admin (Fase 6 - Overhaul Visual e UX):** Todo o painel `/admin` foi redesenhado com linguagem visual premium baseada nas referências `IDEIA ADMIN - CLONE` e `Lista EXPERIENCIAS EM CARDS.webp`. Adoção de:
    - **Visual Split Layout no Catálogo:** Painel esquerdo fixo contendo um mapa estilizado de Manhattan com Pin animado, seletor de categorias em pílula, slider de orçamento dinâmico e classificação por estrelas; painel direito exibindo listagem que inicia em Cards por padrão.
    - **Ações e Navegação Direta:** Clique em qualquer card de atração ou hotel redireciona o operador instantaneamente para a tela de edição, eliminando cliques desnecessários (seleção múltipla em checkbox isolada com stop propagation).
    - **Editor em Duas Colunas com Live Preview:** Painel de edição com formulário à esquerda e um card de visualização em tempo real (celular EcoHome) à direita, atualizado dinamicamente. Entrada de dados via IA (Magic Import) possui animação fluida (iOS/iPhone swipe transition) que desliza o card recém-importado para a tela.
    - **Campos Limpos e Sem Erros:** Campo de categoria convertido em Select Dropdown fechado utilizando constantes reais de banco, evitando conflito de tradução ou erros de digitação.
    - **Sidebar e Dashboard Conectados:** Acesso permanente ao Dashboard a partir de um link fixo no topo da sidebar e no clique do logotipo principal. Módulos de Destaques visíveis com badge de pré-visualização ("SOON"). O módulo de Usuários agora possui uma página interativa `UsersList` implementada com mock data. O módulo de Preços (`PricingManager`) foi implementado utilizando a estética Bento Box e conta com mock data para configuração de *markups* e controle de links de afiliados.
  - **Consumer App Redesign (Fase 6):** O aplicativo do consumidor foi inteiramente reescrito para utilizar a identidade visual Bento Box (Urbanist, `#F0F2F5`, `#E2F18A`). A Landing Page (`Index.tsx`) ganhou um design ultra-premium e o fluxo de Roteiro (`Dashboard.tsx`) agora possui gestão interativa de atrações.
  - **Swipe/Swap Engine e Tinder Flow:** O novo `Onboarding.tsx` introduz uma interface gamificada estilo Tinder, permitindo o usuário deslizar atrações ("Gostei" vs "Passo") para injetar _affinities_ diretas no motor de recomendação. Além disso, o usuário agora pode "Substituir" (`handleSwapAttraction`) atrações diretamente no roteiro, sendo sugerido o próximo melhor match.
  - **Novo Editor Inteligente (Concierge IA):** O formulário de criação/edição (`ExperienceEditor.tsx`) deixou de ser um simples CMS para se tornar a sala de "Treinamento da IA". Expõe _sliders_ matemáticos da Engine (Personas, Companionship, Condições Climáticas) em uma aba dedicada. Além disso, conta com **Multi-Preview**, permitindo visualizar interativamente como o Card se comportará no Tinder Match ou na Timeline do Roteiro. O Botão "Sincronizar IA" mocka/infere a inteligência diretamente do backend. Os dados avançados de IA (Tags, Personas, Estações) são empacotados via JSON e armazenados no campo legado `short_description` para preservar a estabilidade da tabela `experiences`.
  - **Erradicação dos Mocks & Rollback Seguro (Fase 5.5):** Todo o repositório agora lê, sem falhas ou dependências locais, da tabela original `experiences` do Supabase. A tentativa de migração para `content_nodes` foi desfeita (rollback) para preservar os dados ativos do cliente e o Roteiro (Consumer) sem quebrar a plataforma.

- **O que está pendente (Fase 7 - SaaS & Monetização):**
  - **Monetização e Afiliados (Affiliate Hub):** A infraestrutura de links de afiliados (GetYourGuide, Booking, Civitatis, Klook, Viator) com controle dinâmico de comissões.
  - **Autenticação (Supabase Auth):** Criação de conta/login para o Consumidor (Auth Provider) ativado apenas como "Salvar Meu Roteiro".

---

## 4. Decisões Arquiteturais (Fonte da Verdade)
Para manter este documento enxuto, todo o histórico de decisões técnicas, governança de dados, padrões de código (como o uso de Repository) e o racional (o "porquê") por trás de cada escolha estão consolidados no arquivo [DECISIONS.md](./DECISIONS.md).

> **Aviso Importante:** Qualquer alteração que envolva arquitetura, uso de banco de dados ou fluxo principal deve ser validada contra o histórico no `DECISIONS.md`.

---

## 5. Fluxos Oficiais

- **Fluxo de Geração de Roteiro (Consumer):**
  1. Usuário acessa e responde Onboarding (salvo no LocalStorage).
  2. UI requisita o catálogo via `ExperienceRepository.getAll()`.
  3. Repositório verifica o `CacheManager` (Stale-While-Revalidate) -> puxa do Supabase no background -> devolve o Cache para a UI (ou o Mock de forma transparente caso banco esteja vazio/indisponível).
  4. Componente invoca a `Engine` passando o perfil do usuário e a lista do catálogo.
  5. A Engine calcula *scores*, decide o que entra e exibe no roteiro ("Meu Roteiro").
- **Fluxo de Cadastro de Atração (Equipe Interna / Admin):**
  1. Equipe insere URL do GetYourGuide ou site da atração.
  2. IA do Admin raspa os dados, analisa fotos, cria descrição persuasiva, preenche metadados (tags, tempo ideal, coringa `is_must_see`).
  3. Equipe revisa o rascunho preenchido.
  4. Ao aprovar, mídia sobe para o Supabase Storage e registro é salvo no Supabase Database.
  5. Catálogo Consumer recebe a atualização em background na próxima navegação de algum usuário.

---

## 6. Roadmap

Para o acompanhamento detalhado das fases concluídas, em andamento e futuras, consulte o arquivo [ROADMAP.md](./ROADMAP.md).

## Viabilidade Logística (EI-8)
O motor foi expandido para calcular tempos (duração + deslocamento base de 30min) e impedir sobreposições ou agendamentos em horários de fechamento. Experiências são agendadas cronologicamente num dia entre 09:00 e 22:00. Campos `operating_hours` e `operating_hour_exceptions` foram mapeados localmente no `TravelExperience`.

## Pendências de UX / Logística (EI-8 para EI-9)
- **Edição Manual Real**: O orquestrador autogerado integra a logística, mas a feature de preservar de fato o drag & drop ou exclusões manuais feitas pelo usuário está catalogada para a fase EI-9, com refinamento de UI.
- **Trânsito Desconhecido**: Ausência de trânsito emite alerta e não bloqueia. A UI deve refletir, no Consumer, que esse trajeto possui horário aproximado e não confirmado (aviso visual de `TRANSIT_TIME_UNKNOWN`).

## Preservação de Escopo Manual (EI-9)
- Ao interagir com o Dashboard, a intenção do usuário sobre o roteiro gerado possui prioridade estrutural (`locked: true`).
- Em caso de infrações lógicas (ex: fechado no dia, restrição de perfil), a atração **não é apagada**. Ela exibe a tag `conflict` e sinaliza os erros visualmente, permitindo ao viajante decidir.

## Fase ADMIN-1 (Zero "Em Breve")
Concluída. A interface administrativa (B2B) passou por uma refatoração completa, erradicando mocks silenciosos, componentes `ComingSoon` e rotas quebradas. A matriz de páginas reflete com honestidade o suporte atual da arquitetura:
- Módulos operacionais: Catálogo, Hospedagens, Restaurantes, Eventos, Destinos, Importador (IA), Qualidade, Tags, Personas, Regras do Motor.
- Módulos parciais ou dependentes de backend documentados: IA Concierge (parcial), Afiliados (parcial), Usuários (B2C dependente de Auth), Parceiros, Vendas e Analytics.
Relatório gerado na raiz: `ADMIN_ZERO_EM_BREVE_REPORT.md`


## Fase ADMIN-2 (Backend Foundation)
Elaborada proposta de infraestrutura (Edge Functions e SQL migrations locais) para habilitar as páginas administrativas de Analytics, Usuários (B2C), Parceiros, Afiliados, Vendas e IA Concierge, protegendo a tabela raiz do catálogo. Estruturas prontas para aprovação.


## Ordem Oficial de Fases (Travada)
1. ADMIN-1 — Zero Em Breve
2. ADMIN-2A — Auditoria e proposta segura de backend (Atual)
3. INFRA-LOCAL-1 — Ambiente Supabase local operacional
4. ADMIN-2B.1A — Validação estática e pacote de homologação concluídos
5. ADMIN-2B.1B — Validação física de banco e RLS concluída
6. ADMIN-2B.2 — Aplicação controlada no projeto real aguardando autorização

**Fatos da Fase ADMIN-2B:**
* Docker e PostgreSQL local funcionais;
* Migration candidata adaptada com sucesso de `id` para `user_id`;
* 22 assertions SQL preparadas e executadas com êxito (100%);
* Testes TypeScript globais aprovados (incluindo Edge Function);
* ADMIN-2B.2A — Preflight remoto concluído;
* ADMIN-2B.2A.1 — Compatibilização local concluída;
* ADMIN-2B.2B.1 — Backup, migration oficial e dry-run concluídos;
* ADMIN-2B.2B.2 — Aplicação remota aguardando autorização explícita.

6. ADMIN-3 — Conexão das páginas administrativas com dados reais
7. BUGFIX-RUNTIME-1 — Corrigir tela cinza causada por imports ausentes no AdminLayout e remoção do warning do GYG
8. LEGACY-1 — Remoção consolidada de mocks, previews e código antigo
9. SYSTEM-QA — Auditoria funcional completa do Admin e Consumer
10. DESIGN-SYSTEM-1 — Padronização visual global do produto
11. UX-QA — Responsividade, acessibilidade e revisão textual
12. BETA-READY — Segurança, performance e preparação para lançamento

