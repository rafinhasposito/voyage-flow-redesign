# Roadmap de Desenvolvimento

Este documento acompanha as fases do projeto de forma macro, definindo o que já foi feito, o foco atual e o que planejamos para o futuro.

## Fases do Projeto

### Fase 1: Fundação & UI Core [Concluída]
- [x] Criação do boilerplate React + Vite + Tailwind.
- [x] Design System Base (Cores Premium, Fontes Serifadas).
- [x] Construção das interfaces core: Landing, Onboarding, Board, Catalog, Wallet.
- [x] Implementação da Engine V1 (Cálculo Síncrono de Scores baseados em Tags).

### Fase 2: Admin & Inteligência [Concluída]
- [x] Construção da página `/admin`.
- [x] Estrutura para busca e inserção via UI interna.
- [x] Refinamento visual com feedbacks do cliente.

### Fase 3: Arquitetura SaaS e Supabase [Concluída]
- [x] Setup do Supabase (Database, Auth, Storage).
- [x] Definição do schema relacional (`experiences`, `destinations`).
- [x] Implementação do botão/função "Coringa" (`is_must_see`).

### Fase 4: Integração Híbrida & Repositórios [Concluída]
- [x] Criação do Pattern de Repository (`ExperienceRepository`).
- [x] Criação do Gerenciador de Cache (`CacheManager`) com suporte a SWR.
- [x] Desacoplamento de UI vs Banco de Dados.
- [x] Mocks (`DEFAULT_ATTRACTIONS`) configurados como Fallback de segurança.
- [x] Refatoração da Engine (`generateSmartItinerary`) para consumir dados via injeção.

### Fase 5: Integração com Supabase (Supabase Official)

### Fase 6: Integração com Supabase (Supabase Official)

- [x] **Fase 6.1 - Bloco A (Fundação Consumer)**
  - Auth, Profile Idempotente e Trips conectados na base. (Validado remotamente).

- [ ] **Fase 6.2 - Bloco B (Onboarding Concierge & Carteira da Viagem) [Em Andamento]**
  - **Revisão Arquitetural**: Mudança de fluxo para o modelo "Wallet-First" (Começar pelo que o viajante já reservou).
  - Desenvolver 5 etapas: (1) Meta da Viagem, (2) Reservas (Voo/Hotel/Docs), (3) Documentos e Wallet, (4) Estilo e Tinder de Atrações, (5) DNA.
  - Implementar Abstrações: `FlightDataProvider` e Upload V1 local.
  - Cartões Virtuais: `Flight Pass`, `Hotel Pass`, etc.
  - **Schema:** Planejadas tabelas relativas de persistência (Reservations e Documents).
  - Estado local reativo salvo no Supabase passo a passo.

- [x] **Fase 6.3 - Bloco C (Workspace e Roteiro / Seu Canto da Viagem)**
  - Criação da página oficial pós-onboarding `/viagens/:tripId/roteiro` ("Seu canto da viagem").
  - Estrutura modular (`TripSpacePage`, `TripSpaceSidebar`, `TripHeader`, `DayWorkspace`, `TripContextSidebar`, `TripCollections`, `TripPreparations`).

- [ ] **Fase 7: Evoluções do Trip Space & Diferenciais Concorrenciais**
  - Roteiro flexível com drag-and-drop.
  - Recálculo parcial, sem recriar toda a viagem.
  - Roteiro e mapa trabalhando lado a lado com destaque dinâmico.
  - Alertas de fricção logística.
  - Importação automática de e-mails, PDFs, screenshots e reservas.
  - Edição colaborativa em tempo real com permissões e votação.
  - Gestão de despesas da viagem e acerto entre participantes.
  - Modo offline completo para roteiro, mapas, PDFs e QR codes.
  - Diário pós-viagem e mapa de memórias.
  - Guia compartilhável.
  - Alertas em tempo real de clima e lotação.
  - Otimização contínua por localização.
  - Wallet com cartões virtuais e passes de embarque.
  - IA Concierge contextual ativa.

- [ ] **Fase 6.4 - Bloco D (Modo Viagem Mobile)**
  - Acesso aos Passes Offline e mapas básicos. serviços auxiliares em `StorageService` e `ExperienceService`.
  - Bug do SWR (Retorno do cache vazio com Fallback) corrigido: SWR bloqueia renderização com await se o cache está invalidado.
  - Teste manual E2E de criação e edição aprovado.

- [x] **Fase 5.1 - Cadastro de Massa Real (Concluída)**
  - O usuário fará o cadastro manual (via Admin UI) das 5 a 10 atrações reais que cobrem os diferentes cenários e perfis da Engine.
  - Implementação do *Smart Scraper* (com IA) para ingestão automatizada em lote de atrações via URLs do GetYourGuide e adição dos links de afiliado.
  - Estruturação inicial de "Hospedagens" (Basecamps), separando `type = 'hotel'` e `type  - Integrar os inputs da IA com uma Base de Conhecimento RAG de guias locais experientes (evitando roteiros muito óbvios de IA pura).

- [x] **Fase 5.3 - Redesenho Visual e UX do Admin (CMS) (Concluído)**
  - Novo design (Airtable/Linear feeling).
  - Listagem com visualização em Grid/Cards.
  - Editor 2 Colunas (Live Preview à direita).
  - Gerenciamento de Rascunhos (`draft`) com Botões Salvar/Publicar explícitos e Card de Rascunhos no Dashboard.
  - Publicação e Deleção em lote (Bulk Actions) na listagem.

- [x] **Fase 5.4 - Funcionalidades Pró do Admin (Concluído)**
  - Google Maps View na tela de Listagem (Hospedagens e Atrações).
  - Categorização em Select Dinâmico conectada à banco/constante (com taxonomia hierárquica `tipo -> categoria`).
  - Painel de Qualidade de Dados integrado com Google Places Search para Auto-Completar vazios (Endereço, GPS, Fotos, Rating).
  - Edge Function `reframe-taxonomy` acionada por um botão "Revisar Taxonomia (IA)" para varrer e corrigir categorizações legadas para a nova taxonomia hierárquica.
  - Nenhuma alteração no Supabase (UI-First approach).

- [x] **Fase 5.3b - Redesenho Visual Premium do Admin (Concluída)**
  - Todos os 8 arquivos do painel `/admin` redesenhados com estética "IDEIA ADMIN - CLONE".
  - Paleta neon-lime (#E2F18A) + mint (#7CFE9D) + cards pastel por propósito.
  - Layout Bento Box com `rounded-3xl` em todos os containers e sidebar flutuante.
  - Abas em pílula preta no ExperienceEditor e DestinationEditor.
  - Medidor circular tracejado estilo "Lead Score" no QualityDashboard.
  - Fonte global Urbanist confirmada e em uso em toda a aplicação.

- [x] **Fase 5.4 - Design System Clone (Concluída)**
  - AdminLayout refundado com canvas cinza, sidebar sem bordas, pill lime ativo, collapse toggle.
  - Catálogo com 3 views (Strips/Cards/Compact) + filtros avançados (preço, rating, qualidade, bairro, categoria, must-see).
  - Mapas interativos via Google Maps adicionados ao Catálogo (Visualização) e Editor (Captura de Coordenadas Lat/Lng).
  - Filtro de Orçamento (`base_cost`) 100% ativado e testado no Catálogo.
  - Dashboard Bento Box com hero, 4 chips de stats do Supabase, atividade recente, módulos Em Breve (Usuários, Preços) e módulo de Destaques funcional.
  - QualityDashboard com medidor SVG circular animado e lista de críticos, integrado a uma Engine de Auto-Heal (Cura de dados via Google Places).
  - **Dashboard de Destaques:** Interface (`FeaturedDashboard.tsx`) com design Bento Box para gerenciar curadoria manual de experiências em destaque.
  - **Importador Automático em Lote:** Criação da página funcional `/admin/import` e Edge Function `import-bulk` para ler artigos de blogs (ex: dicasnovayork.com.br) com IA e cadastrar múltiplos itens em lote.
  - **Contexto Temático Automático:** IA atualizada para detectar o tema do artigo (ex: "Pôr do Sol") e injetar esse contexto no título e nas tags automaticamente.
  - **Fix Fluxo de Rascunhos:** Banner amarelo de "N rascunhos aguardando revisão" adicionado ao topo do Catálogo. Botões "Ver Rascunhos" (filtro automático) e "Publicar Todos (N)" com um clique sem precisar selecionar item a item.
  - **Botão Importar URL no Catálogo:** Link direto para `/admin/import` adicionado na toolbar do `ExperiencesList`, eliminando a necessidade de voltar ao Dashboard para acessar o importador.
  - **Pricing Manager:** Componente de gestão de *Markups* e Afiliados implementado com a estética Bento Box, contendo mock data inicial.
  - **Módulo de Usuários (UI):** Criação da página `UsersList` no Admin com estética Bento Box e mock de dados, preparando o terreno para a Fase 6.
  - Build de produção: ✅ zero erros.

- [x] **Fase 5.5 - Refatoração TypeScript e Rollback para a Tabela Original**
  - Rollback arquitetural de `content_nodes` para `experiences` para restaurar o catálogo de dados preexistente do usuário e manter a compatibilidade direta com a UI.
  - O Admin CMS, `ExperienceRepository` e as funcionalidades da Engine (Swipe/Swap) operam agora com a tipagem estrita de `experiences`.
  - Dados de inteligência empacotados em `short_description` (via JSON) para não sujar a tabela original.
  - Resolução de 100% dos erros de compilação (Strict TypeScript).
  
- [x] **Fase 5.5 - Erradicação dos Mocks e Swipe / Swap Engine**
  - Integração limpa e direta do "Swipe / Troca de Atrações" (`handleSwapAttraction`) com a base real do Supabase sem perder o progresso das curadorias manuais.
  - Garantir que o Consumer e o Admin operam sob a mesma tipagem e regras.

### Fase 6: Consumer App Redesign & Mocks Eradication [Concluída]
- [x] Novo design system Bento Box no `AppNav` e componentes globais.
- [x] Criação da nova `Landing Page` interativa com destaques.
- [x] Novo `Onboarding` (Tinder Flow) que injeta afinidades diretamente no `interactions` do `UserProfile` via gestos de *Swipe*.
- [x] `Dashboard` do Viajante redesenhado, com cards arredondados e botão "Substituir Atração (Swap)".

### Fase 6.5: O Novo Editor Inteligente (Concierge IA) [Concluída]
- [x] Criação do `ExperienceEditor.tsx` do zero, focado em treinar a IA.
- [x] **Aba de Inteligência (Engine Settings):** UI com sliders para `personaWeights`, `companionshipCompatibility`, `recommendedSeasons`, e `exclusivityLevel`.
- [x] **Multi-Preview:** Abas para Tinder Match e Roteiro interativo diretamente no admin.
- [x] **Botão Sincronizar IA:** Botão mágico que infere a matemática da Engine para facilitar o trabalho do operador.

### Fase 7: Autenticação, Escala SaaS e Monetização (Futuro) [Planejada]
- [ ] Criação de conta/login para o Consumidor (Auth Provider) ativado apenas como "Salvar Meu Roteiro".
- [ ] **Affiliate Hub:** Painel Admin para gerenciamento de comissões, Tracking de cliques e controle de receita.
- [ ] Integrações reais com APIs externas via Edge Functions (precificação GetYourGuide em tempo real).
- [ ] Sistema de Review/Feedback de usuários.
- [ ] Funcionalidades Multi-player (compartilhar roteiro de casal/amigos).


### Fase EI-6: Especialização de Acessibilidade e Políticas (Admin CMS) [Concluída]
- [x] **EI-6A:** Auditoria e Limpeza de Migrations.
- [x] **EI-6B:** Refatoração de Tipos para novos campos (min_age, adult_only, wheelchair_accessible).
- [x] **EI-6C:** Preparação do UI do Admin CMS (Editor) e da Lógica de Restrições na Inteligência. 176 testes passando. Commit `ec1efe0`.
- [x] **EI-6D:** Persistência Controlada — Repair seletivo executado (006, 007, 008); db push aplicado (001–005 e 20260718200000).

### Fase EI-7: Restrições aplicadas ao Roteiro e ao Consumer [Concluída]
- [x] **ETAPA 1:** Auditoria curta do Engine e fluxos.
- [x] **ETAPA 2:** Implementação do `evaluateRestrictions` na `ExperienceMatchingEngine` com classificação de bloqueios, avisos e informações, baseados em campos do `UserProfile`.
- [x] **ETAPA 3:** Consumer: itens bloqueados impedem adição manual (botão desabilitado com "Restrito pelo Perfil") e não são inclusos automaticamente no Roteiro Gerado. Atualização do componente `ExperienceWarning` (cores diferenciadas para bloqueios e alertas).
- [x] **ETAPA 4:** Suíte de 15 testes de restrições implementada e validada. Total 191/191 testes passando.
- [x] **ETAPA 5 & 6:** Build ok. Documentação atualizada (ROADMAP, PROJECT_CONTEXT, DECISIONS).

### Fase EI-8: Viabilidade Logística do Roteiro [Concluída]
- [x] Engine logística para avaliar: fechamento no dia, fechamento no horário, deslocamento real via `transit_options`.
- [x] Integração da logística no `generateSmartItinerary` com priorização após restrições factuais.
- [x] Ajuste automático de horários para a janela disponível (9:00 - 22:00) respeitando conflitos.
- [x] **Ressalvas/Pendências**: Preservação e edição manual real do roteiro serão refinadas na EI-9 (atualmente os testes apenas simulam forçando scores altos). Quando o deslocamento é desconhecido (`TRANSIT_TIME_UNKNOWN`), o horário apresentado no roteiro é aproximado (estimado) e não representa um deslocamento real confirmado.

### Fase EI-9: Refinamento de UX, Edição Manual e Roteiro Consumer [Concluída]
- [x] Criação do estado `StopEditMetadata` para registrar intenções manuais do usuário (fonte manual ou engine, trancamento e conflitos).
- [x] Lógica de recálculo parcial (`recalculateItinerary`) separada da criação inteligente.
- [x] Capacidade de Mover e Fixar componentes pelo `Dashboard`.
- [x] Recálculo logístico focalizado apenas nos nós de contato.
- [x] Identificação de conflitos e persistência visual ao invés de exclusão silenciosa.
- [x] Lógica de "Desfazer" utilizando array de `itineraryHistory`.

### Fase EI-10: Polimento UX e Refinamentos de Interface do Consumer [Concluída]
- [x] **EI-10A:** Drag and Drop inteligente (reordenar dias/slots).
- [x] **EI-10B:** Indicadores visuais de edição ("IA", "Fixado", "Manual").
- [x] **EI-10C:** Modal flutuante para substituição local.
- [x] **EI-10D:** Refinamento A11y e padronização das paletas.

### Fase ADMIN-1: Zero "Em Breve" (Refatoração Limpa) [Concluída]
- [x] O Admin foi inteiramente validado, sem componentes "Em breve" residuais.
- [x] Criação das views operacionais e conectadas ao Catálogo Central (Hospedagens, Eventos, Restaurantes, Destinos, Tags, Personas e Regras do Motor).
- [x] Criação das views descritivas apontando lacunas de backend para áreas sem suporte (Vendas, Parceiros, B2C Users, Analytics).
- [x] Adoção rigorosa do princípio de honestidade estrutural na Interface.


### Fase ADMIN-2: Fundação Real de Backend
- [x] **INFRA-LOCAL-1 — Ambiente Supabase local operacional**
- [x] **ADMIN-2B.1A — Validação estática e pacote de homologação concluídos**
- [x] **ADMIN-2B.1B — Validação física de banco e RLS concluída**
- [x] **ADMIN-2B.2A — Preflight remoto concluído**
- [x] **ADMIN-2B.2A.1 — Compatibilização local concluída**
- [x] **ADMIN-2B.2B.1 — Backup, migration oficial e dry-run concluídos**

### Fase TRIP-READY-1: Jornada funcional do viajante [Concluída]
**PRIORIDADE MÁXIMA ATÉ A VIAGEM**
- [x] Auditoria funcional rápida e mapeamento.
- [x] Rota de teste completa (Inicio -> Onboarding -> Itinerário).
- [x] Modificar Engine para usar `ExperienceRepository` (dados reais) em vez de Mocks.
- [x] Criar interface simples para configuração real da viagem (destino, datas, hotel, reservas).
- [x] Refinar mapa visual no Dashboard.
- [x] Persistência em DB via Supabase (`trips` e `trip_reservations`).
- [x] Match Idempotente e Concorrência Segura no Frontend (Locks).

### Engine V2 [Fase B Concluída]
- [x] **Fase A (Fundação Temporal):** Concluída.
- [x] **Fase B (Viabilidade Semântica e Temporal):** Concluída.
- [x] **Fase C (Geografia e Roteamento API):** Concluída e aprovada.
  - GeoRoutingProvider isolado do fornecedor externo (uso de `local_fallback` via Haversine, confidence `low`).
  - Deslocamento participa ativamente da alocação temporal.
  - Repair Pass atua preventivamente para impedir conflitos de deslocamento (atividades flexíveis reorganizadas ou removidas, reservas fixas nunca movidas).
  - Nenhuma integração final com `trips.itinerary` ou Trip Space nesta etapa.
  - Pendências Futuras Registradas: Enriquecer GPS do Arlo NoMad; Mapear voo de partida; Corrigir nomes vazios nos avisos `DUPLICATE_GEOPOINT_REVIEW_REQUIRED`; Revisar registros locais que compartilham mesmas coordenadas; Avaliar provider externo na próxima etapa.

**Fases Congeladas Temporariamente:**
- ADMIN-2B.2B — Aplicação remota e pós-validação
- ADMIN-3 — Conexão das páginas administrativas
- DESIGN-SYSTEM-1 — Pós-viagem

### Fase INFRA-LOCAL-1: Preparar ambiente isolado para testes Supabase
- Instalar ou ativar Docker Desktop manualmente
- Validar `docker info`
- Iniciar Supabase local
- Executar a candidata duas vezes
- Executar as 15 assertions SQL
- Testar RLS
- Testar a Edge Function localmente
- Produzir o relatório físico para liberar a ADMIN-2B.2

### Fase BUGFIX-RUNTIME-1: Corrigir tela cinza causada por imports ausentes no AdminLayout [Concluída]
- Identificada causa raiz da tela cinza: ReferenceError devido à ausência de imports de ícones (`Briefcase`, `Percent`, `CreditCard`) em `AdminLayout.tsx`.
- Removido tag global fixa do GYG em `index.html` que causava aviso repetitivo `VITE_GYG_PARTNER_ID is not defined`.
- Confirmado comportamento robusto da aplicação quando `VITE_GYG_PARTNER_ID` ausente (desabilita afiliação localmente sem quebrar app, tratado em `ExperienceRepository.buildAffiliateLink`).
- Confirmado conexão direta com Supabase remoto (`idcucjpanzufkipvfmse`) via configurações do Vite/Env sem influências de Docker/Supabase locais.
- Execução limpa e 272 testes aprovados.
- **Débito Técnico Cadastrado**: Adicionar Error Boundary global para impedir tela vazia em crashes de renderização.

### Fase DESIGN-SYSTEM-1: Padronização global do Admin e Consumer [Bloqueada]
- Tokenização de cores e tipografia
- Padronização de cabeçalhos, cards, tabelas, filtros e formulários
- Revisão de estados vazios
- Responsividade e Acessibilidade (B2B e B2C)

### Atualizações - Fase C (Inteligência Geográfica)
- **Status:** Concluída.
- **Branch:** feature/itinerary-engine-v2-geography
- **Implementações:** Provider local `local_fallback` aprovado, deslocamento bloqueante, segmentação temporal e geográfica estrita sem reabertura de integrações externas.
