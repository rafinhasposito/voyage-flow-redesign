# Histórico de Decisões Arquiteturais

Este documento registra as decisões importantes tomadas ao longo do projeto e o **racional (porquê)** por trás delas. Se você for alterar algo estrutural, consulte este arquivo antes para garantir que não está revertendo uma decisão já solidificada.

## 1. Uso do Supabase como Backend Oficial
- **O que foi decidido:** Supabase atuará como banco de dados principal (PostgreSQL), autenticação para admins, e Storage para mídias.
- **Por quê:** O projeto precisa evoluir para um SaaS/plataforma sem reinventar a roda na infraestrutura. O Supabase fornece RLS nativo (que nos ajuda a proteger dados da API pública de forma simples) e integrações nativas excelentes para Next.js/Vite, acelerando a fase de Prototipagem e Go-To-Market.

## 2. Padrão Repository Obrigatório
- **O que foi decidido:** Nenhuma tela, componente, ou lógica de negócio (Engine) deve interagir diretamente com o banco de dados (Supabase). Todos os dados devem ser trafegados através de Classes/Objetos `Repository` (ex: `ExperienceRepository`).
- **Por quê:** Isso garante que a UI e a inteligência matemática da Engine sejam puras. Se no futuro o Supabase for substituído ou precisarmos adicionar um Redis na frente, apenas o Repository será modificado.

## 3. LocalStorage Temporário (Fricção Zero)
- **O que foi decidido:** O usuário final **não precisará realizar login** nesta fase. Os perfis, interesses e estado do roteiro são persistidos em `LocalStorage`.
- **Por quê:** A prioridade máxima do produto hoje é atração, conversão e *wow effect* (fricção zero). Pedir cadastro antes do usuário visualizar o valor destrói a conversão de entrada. Auth para usuários finais será adicionado futuramente como *upsell* ou função de salvamento remoto.

## 4. Stale-While-Revalidate (SWR) no Cache Local
- **O que foi decidido:** Implementamos um `CacheManager` que guarda catálogos por algumas horas localmente.
- **Por quê:** O roteiro precisa parecer instantâneo ("mágico"). Fazer um *fetch* longo no Supabase a cada clique frustraria a experiência. Com o SWR, retornamos o cache instantâneo e, no *background*, atualizamos via Supabase para futuras leituras.

## 5. Abstração de Serviços Auxiliares (Services)
- **O que foi decidido:** Operações complexas não ligadas diretamente ao banco (como upload de imagens no Storage e extração de metadados via IA Edge Functions) devem ser abstraídas em `StorageService` e `ExperienceService`.
- **Por quê:** Mantém os componentes React limpos e focados apenas em UI e formulários, enquanto o `Repository` cuida exclusivamente das tabelas de dados.

## 6. Separação Estrita de Governança no Admin
- **O que foi decidido:** Apenas o time interno usa a interface Admin (atrás de `/admin`).
- **Por quê:** O modelo de curadoria precisa ser estrito. As atrações passam pelo rigor da IA e humana. Os usuários finais apenas *consomem* roteiros.

## 7. Responsabilidade do ExperienceRepository (Limites)
- **O que foi decidido:** Na Fase 5, o `ExperienceRepository` manteve o CRUD de Admin e o SWR do Consumer juntos para evitar "over-engineering". No entanto, **está registrado** que se o painel Admin continuar crescendo, o repositório será fatiado em `ConsumerExperienceRepository` e `AdminExperienceRepository`.
- **Por quê:** Para manter o princípio de Single Responsibility e não inflar o bundle do Consumer com queries administrativas pesadas no futuro.

## 8. Lógica de "Bypass" (O Botão Coringa)
- **O que foi decidido:** Criação da tag booleana `is_must_see`.
- **Por quê:** Atrações icônicas (ex: Torre Eiffel, Estátua da Liberdade) não podem ser filtradas e ocultadas por perfis restritivos ("só quero coisas obscuras e foodtruck"). Elas são *Must-See*. A Engine foi programada para dar um *boost* pontual e priorizar tais itens quando apropriado, protegendo a confiabilidade da curadoria.

## 9. O Hotel como "Basecamp" (Nó Estrutural)
- **O que foi decidido:** Hotéis não são classificados como simples "experiências" na modelagem lógica. Eles foram isolados usando a coluna estrutural `type = 'hotel'` na tabela `experiences`.
- **Por quê:** O hotel não é um ponto turístico de passagem; ele é o "Nó de Partida e Retorno" do dia. A IA precisa saber exatamente onde o usuário começa e termina o dia para otimizar tempo de deslocamento, sugerir check-ins e lidar com logística de bagagem. No futuro (Fase 6+), se os hotéis exigirem dezenas de colunas próprias (políticas de quarto, amenities), eles poderão ser migrados para uma tabela `accommodations` dedicada. Até lá, a coluna `type` mantém a agilidade sem sujar a lógica matemática das atrações.

## 10. Estruturação Rígida de Tipos (ENUMs) e Scrapers
- **O que foi decidido:** Tipos estruturais do banco (como o `type` da experiência) devem idealmente usar Constraints (ex: `CHECK type IN ('hotel', 'attraction')`) ou ENUMs no Postgres, em vez de `TEXT` livre. Scrapers de ingestão em massa devem ser construídos com foco em metadados estruturados (JSON-LD, Schema.org) em vez de seletores CSS frágeis.
- **Por quê:** O sistema vai escalar para dezenas de tipos (`restaurant`, `airport`, `train_station`, `beach`). Textos livres geram anomalias no banco (`HOTEL`, `Hoteis`, `basecamp`). Da mesma forma, seletores de CSS quebram a cada A/B test do GetYourGuide, enquanto Microdatas SEO (Schema) são contratos estáveis de longo prazo. Essa é a diretriz para a escala industrial.

## 11. Configuração Centralizada de Preços e Afiliados (Bento Box)
- **O que foi decidido:** A gestão de *markups* e links de afiliados (como GetYourGuide) será feita em uma interface administrativa dedicada (`PricingManager`) usando a estética Bento Box e mock data na fase atual, antes de persistir globalmente.
- **Por quê:** O modelo de monetização depende de comissionamento via afiliados e markups embutidos. Ter um painel que permite simular a receita em tempo real assegura agilidade nas campanhas de marketing e previsibilidade de caixa sem necessitar mexer em JSON ou código hardcoded.

---

## 💡 Apêndice: Hipóteses Arquiteturais e YAGNI (You Aren't Gonna Need It)

Nós evitamos transformar boas ideias em "Overengineering" prematuro. As regras abaixo são conceitos aprovados, porém **ainda não persistidos no banco de dados**, existindo apenas em memória (TypeScript) até que um requisito real exija:

### A. Taxonomia: Category vs Role (Em Memória)
Em vez de separar `category` (hotel) e `role` (basecamp) em tabelas no Supabase agora, a Engine inferirá o "Papel" em tempo real a partir da "Categoria". O Banco de Dados permanece simples.

### B. A Entidade 'Stop' (Em Memória)
O conceito de `Trip -> Day -> Stop -> Experience` será utilizado nas classes TypeScript da Engine para manipulação flexível do Itinerário. O `Stop` **não será uma tabela no Supabase** até que surja um requisito de persistência de usuário (como colaboração, histórico de edições ou compartilhamento do roteiro manipulado).

### C. A Fonte da Verdade (Engine vs Usuário)
Quando o usuário editar manualmente um roteiro gerado (ex: Swap), precisaremos definir quem "vence" as regras (Engine vs User Intent). Até lá, a Engine é a única fonte da verdade e gera do zero a cada alteração de perfil.

## [5.5] Rollback de ContentNodes para Experiences (Estabilidade)

**Data:** 11/07/2026

- **Problema:** A migração parcial de `experiences` para a tabela genérica `content_nodes` corrompeu o funcionamento do Painel Administrativo. Registros reais de usuários (atrações cadastradas via UI) não foram migrados corretamente, os types se desalinharam com o motor de Roteiros, e filtros baseados em arrays (tags) pararam de funcionar corretamente sem complexas sub-queries no schema de traduções JSONB.
- **Opções Consideradas:**
  1. Forçar a migração executando um script SQL pesado no banco ativo e reescrevendo o Consumer (Roteiros). Risco alto.
  2. **Rollback completo** do Admin para operar em cima de `experiences`, estendendo o uso da coluna legada `short_description` para encapsular a matemática da IA em JSON, sem tocar na arquitetura de tabelas. Risco baixo.
- **Decisão:** **Opção 2**. Todo o repositório (`ExperienceRepository`, `Import`, `ExperienceEditor`, `QualityDashboard`, `HotelsList`) foi revertido para apontar 100% para a tabela `experiences`. A tipagem foi estritamente restaurada para os padrões oficiais do Supabase. A IA matemática e embeddings futuros serão armazenados na tabela base original (via `short_description`).
- **Consequência (Positiva):** O Consumer e o Admin voltaram a se comunicar pela mesma camada de dados de forma 100% transparente. Usuário recuperou as dezenas de atrações inseridas.

---

## [6.0] Roteiros Gamificados (Tinder Flow e Swap System)

### D. Engine Pura e Assinatura de Configuração (Em Memória)
No futuro, a assinatura da Engine (`generateSmartItinerary(profile, catalog)`) deve evoluir para um objeto único `({ profile, catalog, settings, constraints })` para escalar com novos requisitos (clima, eventos, restrições físicas).

### E. Payload de Resposta da Engine e Versionamento
A Engine não deverá retornar apenas um array de dias, mas sim um objeto estruturado: `{ version: "1.0", itinerary: [], warnings: ["NO_HOTELS", "EMPTY_CATALOG"] }`. Isso garantirá rastreabilidade (saber qual versão do algoritmo gerou o roteiro) e permitirá que a UI lide de forma elegante com cenários de falha sem tentar adivinhar o motivo do array vazio.

### F. Evolução para CatalogService
O atual `ExperienceRepository` (que puxa do Supabase e faz cache SWR) evoluirá no futuro para um `CatalogService`, atuando como um agregador que unirá dados de banco, cache, scraper e enriquecimento via IA em uma única fonte de verdade para a Engine.

## 11. Arquitetura UI-First no Admin CMS (Fase 5 Substituta)
- **O que foi decidido:** O painel administrativo foi inteiramente reescrito sob a estética de SaaS Premium (estilo Airtable/Linear) ANTES de realizarmos qualquer migração de banco de dados para novas colunas (como `priority` ou `ideal_duration`).
- **Por quê:** Evitar overengineering no Supabase. O foco atual é a Produtividade do Operador. Ferramentas de exclusão definitiva, ações em lote, filtros multi-seleção e dashboards analíticos foram priorizados para facilitar a curadoria de milhares de dados usando apenas o schema que já possuíamos.

## 12. Padronização de Bairros (Neighborhoods) sem Tabela Relacional
- **O que foi decidido:** Os bairros de Nova York agora são selecionados através de uma lista controlada (constante no Frontend) ao invés de digitação livre (para evitar erros de digitação). Nenhuma tabela relacional `neighborhoods` foi criada no banco.
- **Por quê:** O MVP engloba apenas Nova York. Adicionar tabelas relacionais agora geraria complexidade desnecessária nas queries. A lista controlada no código já fornece a UX necessária para escalarmos as buscas.

## 13. Redesenho Visual do Admin — Estética "IDEIA ADMIN - CLONE"
- **O que foi decidido:** Redesenho completo dos 8 arquivos do painel `/admin` adotando a identidade visual da referência `IDEIA ADMIN - CLONE` da pasta `design-inspiration/`. Paleta: neon-lime `#E2F18A`, mint `#7CFE9D`, cards pastel por propósito. `rounded-3xl` em todos os containers. Sidebar flutuante sobre canvas cinza `#ECEFF1`. Abas em pílula preta. Medidor circular SVG no QualityDashboard.
- **Por quê:** O painel interno precisa ser agradável de usar diariamente. Um design premium reduz o esforço cognitivo e o atrito na curadoria de dados. A referência visual usada (Urbanist + neon-lime + bento cards) é idêntica à fonte tipográfica já configurada no projeto, garantindo coerência zero-custo.
- **Técnica de gradientes:** Gradientes de background inline via `style={{ background: 'linear-gradient(...)' }}` em vez de classes Tailwind JIT para controle granular de stops de cor sem risco de purge.
- **Impacto:** Zero impacto em lógica de negócio, repositórios ou dados — mudança puramente de UI.

## 13. Design System Visual (Clone Dynamic 365)
- **O que foi decidido:** O Admin CMS adota o sistema de design extraído das referências "IDEIA ADMIN - CLONE" (Dynamic 365 / Sales Hub), com tokens fixos: canvas `#F0F2F5`, lime `#E2F18A`, mint `#7CFE9D`, cards brancos `rounded-[24px]`, strips `rounded-[18px]`, sombra `shadow-sm` como única separação visual (zero bordas duras), tipografia Urbanist.
- **Por quê:** Maturidade visual imediata sem criar um design system do zero. A linguagem visual do Dynamic 365 é de um SaaS enterprise premium mas com calor humano (pastéis, lime, rounded extreme). Adapta-se perfeitamente à identidade travel do Voyage Flow sem copiar literalmente.

## 14. 3 View Modes persistidos no localStorage
- **O que foi decidido:** O Catálogo e Hospedagens possuem 3 modos de visualização: Strips (padrão), Cards Grid e Compact (tabela densa). A view escolhida é persistida via `localStorage` por chave (`vf-catalog-view`).
- **Por quê:** Operadores com catálogos grandes precisam de densidade (Compact), enquanto revisores visuais preferem Cards. Nenhuma feature de banco é necessária — é puramente UX.

## 15. Módulos "Em Breve" como Estrutura Visível
- **O que foi decidido:** Preços e Destaques são exibidos no AdminLayout e no Dashboard como módulos reais com badge "SOON", não escondidos (cada um tem rota própria com `ComingSoon` placeholder). O módulo de Usuários, que antes também era "Em Breve", agora possui uma UI funcional (`UsersList`) com dados mockados.
- **Por quê:** Mostrar ao cliente/stakeholder o roadmap de produto sem precisar ter a feature pronta gera comprometimento de visão e evita a sensação de sistema incompleto. A evolução do módulo de Usuários para uma UI interativa serve como protótipo de alta fidelidade para a Fase 6 (Autenticação e Escala).
## 16. Integração de Mapas Reais (Google Maps)
- **O que foi decidido:** Substituição dos mocks visuais (SVG animados) no painel Admin por instâncias reais do Google Maps via `@vis.gl/react-google-maps`. O Catálogo de Experiências e Hospedagens agora exibe um mapa interativo das propriedades filtradas, e o Editor possui um mapa clicável para preencher `location_lat` e `location_lng` automaticamente.
- **Por quê:** Inicialmente foi tentado o Leaflet, mas optamos pelo Google Maps Platform a pedido do cliente para usar a chave de API fornecida e ter o ecossistema padrão da indústria.

## 17. Importador Automático em Lote (Bulk Importer)
- **O que foi decidido:** Substituição do placeholder "Em Breve" na rota `/admin/import` por uma página funcional integrada a uma nova Edge Function do Supabase (`import-bulk`). A interface permite extrair até 15 hotéis/atrações de um post de blog de turismo geral (ex: dicasnovayork.com.br) de uma única vez, exibindo as experiências extraídas em um grid de cards Bento com seleção individual para gravação em lote.
- **Por quê:** O operador de curadoria precisava de uma ferramenta mais robusta do que preencher um formulário por vez. blogs de dicas de viagem contêm a maior densidade de dados qualificados de turismo na web. Permitir que o operador apenas cole a URL do blog e selecione o que deseja cadastrar acelera a curadoria de dados em 10x sem precisar de scripts CLI.
- **Estrutura Técnica:** Jina Reader lê o markdown bruto da página -> envia para o modelo gpt-4o-mini estruturar em um array JSON seguindo o schema exato do banco -> frontend exibe o preview estruturado -> Supabase realiza a inserção direta em lote.


## 21. Enriquecimento de IA com Google Places (Importadores Mágicos)

## 27. Dashboard de Destaques (Featured Experiences)
- **Decisão:** Criação de um dashboard específico (`FeaturedDashboard.tsx`) sob a identidade visual Bento Box para permitir aos administradores o controle manual de quais experiências são promovidas e destacadas na homepage.
- **Justificativa:** É necessário ter flexibilidade comercial para impulsionar destinos sazonais ou roteiros patrocinados sem depender exclusivamente das recomendações automáticas da Engine, provendo controle total para a curadoria de destaques.
- **Decisão:** Acoplar a Places API do Google às Edge Functions de Importação (Unitária e Lote).
- **Justificativa:** A OpenAI (GPT-4o-mini) e a Jina AI são excelentes para extrair textos (preço, descrição, categoria) de páginas web, mas a IA falhava consistentemente em adivinhar a latitude e longitude exatas. Ao cruzar o título extraído pela IA com a Places API (`textsearch`), o sistema garante a coordenada exata para os Roteiros Inteligentes e extrai fotos em alta resolução nativas do Google, tornando a curadoria quase 100% automatizada e precisa.

### 8. Frontend Tooling e Dependências de UX (EI-10)
- **Decisão:** Utilizar HTML5 Drag and Drop nativo.
- **Motivo:** Evitar inchaço no bundle (como instalar `dnd-kit` ou `react-beautiful-dnd`) para funcionalidades razoavelmente simples de reordenação em Bento Box, mantendo alinhamento com a arquitetura leve e clean demandada pelo projeto.
- **Impacto:** Menor tempo de compilação, dependência zero no pacote final. A UX se mantém responsiva via atributos `draggable` nativos do DOM aliados ao layout grid Tailwind.

### 9. Arquitetura de Validação
- **Decisão:** As validações do Supabase (Row Level Security - RLS) devem ser a fonte primária de segurança de leitura/escrita.

## 22. Auto-Heal (Cura de Dados) e Dashboard de Qualidade
- **Decisão:** Centralizar a inteligência de enriquecimento de catálogo no `QualityDashboard.tsx` (`/admin/quality`) em vez das telas de listagem, e programar o worker `enrich-catalog` para curar *todos* os campos críticos (Rating, Avaliações, Endereço, GPS, Fotos).
- **Justificativa:** Botões de "atualização mágica" nas telas de listagem causavam confusão UX e desvio de propósito (listagem vs curadoria). Ao mover para o Dashboard de Qualidade, transformamos o sistema em um monitor ativo de saúde dos dados. A query agora detecta de forma holística qualquer vazio crítico e tenta resolvê-lo sozinho via Google Places, reduzindo o trabalho manual do operador a quase zero.

## 23. Taxonomia Hierárquica (Tipo -> Categoria)
- **Decisão:** Substituição da listagem plana de categorias por uma estrutura hierárquica conectada, onde o `type` ("attraction", "food", "hotel", "transport", "event") determina o menu de `category` filhas disponíveis.
- **Justificativa:** O sistema anterior possuía categorias muito sobrepostas (ex: "Restaurante" era um tipo e também uma categoria), o que causava confusão no painel de administração e reduzia a precisão da Inteligência Artificial. Com a taxonomia acoplada, a Engine de Itinerários (UI) e os geradores da OpenAI (Backend Edge Functions) tornam-se assertivos, padronizando os registros com exatidão sem risco de alucinações (ex: classificar um bar como hotel).

## 24. Botão de "Faxina" de Taxonomia Legada com IA
- **Decisão:** Criação do botão "Revisar Taxonomia (IA)" no Dashboard de Qualidade que aciona a Edge Function `reframe-taxonomy`. A função usa OpenAI para escanear a base de dados por qualquer experiência com tipos/categorias antigas (ex: classificado manualmente como "Restaurantes & Gastronomia") e converte de volta para a taxonomia estrita.
- **Justificativa:** Garantir a saúde do banco legando o trabalho sujo de mapeamento retroativo para a IA, em vez de depender de migrações pesadas ou regex ineficientes.

## 25. Gerenciamento Explícito de Rascunhos (Drafts)
- **Decisão:** Remoção do seletor oculto de "status" no formulário de edição em favor de dois botões claros: "Salvar Rascunho" e "Salvar & Publicar". Adição de um card no Dashboard Administrativo indicando quantos rascunhos precisam de revisão. Criação de uma barra de "Ação em Lote" suspensa na lista do Catálogo que permite aprovar (publicar) ou excluir múltiplos rascunhos de uma vez só.
- **Justificativa:** Curadoria de dados requer revisão e pausas. Ter rascunhos permite ingestão de massa ou rascunhos automáticos sem sujar o catálogo público (Engine). A opção de aprovação em lote melhora a usabilidade em listas extensas de curadoria.

## 26. Redesenho Completo do Consumer App (Bento Box)
- **Decisão:** Substituição total do tema clássico do Consumer App (fundo bege `#FAF8F5`, tipografia serifada, dourado `#C5A85C`) pela mesma identidade visual do Admin (Urbanist, canvas cinza `#F0F2F5`, neon-lime `#E2F18A`, cards `rounded-[24-28px]`, sombra suave). Criação de um componente de navegação compartilhado `AppNav` com pills de navegação em grupo.
- **Justificativa:** O viajante agora vê a mesma linguagem visual premium que o admin usa. Isso consolida a identidade da marca, reduz o esforço de manutenção (uma só linguagem visual) e eleva a percepção de qualidade da experiência de usuário final.

## 28. O Novo Editor Inteligente (Concierge IA)
- **Decisão:** A página de edição de experiências (`ExperienceEditor.tsx`) foi completamente reescrita, parando de ser um formulário comum de CMS para se tornar o "Painel de Treinamento da IA". As variáveis matemáticas usadas pela `ExperienceMatchingEngine` (ex: `personaWeights`, `companionshipCompatibility`, `recommendedSeasons`) agora são expostas visualmente através de *sliders*.
- **Justificativa:** Anteriormente, o administrador só podia inserir *Tags* e a IA tinha que inferir o resto, o que gerava dependência de heurísticas fracas no Frontend. Ao expor os pesos (0-100) da matemática da IA no painel, o operador ganha controle absoluto sobre a probabilidade de um item dar Match no "Tinder" ou de ser incluído no Roteiro.
- **Decisão Adicional:** O botão "Sincronizar com IA" foi adicionado para inferir matematicamente esses pesos a partir de um link (GetYourGuide/etc) em conjunto com LLMs, automatizando a curadoria pesada. A UI também exibe abas de **Multi-Preview**, permitindo visualizar exatamente como o item ficará no *Tinder Match* ou no *Roteiro* antes mesmo de publicar.

### 2026-07-18: Sincronização de Histórico de Migrations e Persistência de Políticas (Supabase)
**Contexto:** Na finalização da Fase EI-6D, identificamos divergência entre o histórico local de migrations e os objetos já existentes em produção (tabelas e RLS criadas via Dashboard GUI nas fases EI-2 e EI-3).
**Executado:** Repair seletivo (`supabase migration repair --status applied`) foi efetivamente executado para as migrations 006, 007 e 008, registrando-as como aplicadas no histórico remoto sem reexecutar o SQL. Em seguida, `supabase db push --linked --include-all` foi executado aplicando as migrations 001 a 005 e a nova 20260718200000 (Políticas e Acessibilidade) — todas validadas previamente com `--dry-run`. Google Maps e Places foram formalmente registrados como legado descontinuado, e MapLibre + OpenFreeMap como solução oficial.
**Resultado:** As 107 experiências foram preservadas intactas. Todas as 9 migrations estão sincronizadas. Os 10 novos campos de políticas e acessibilidade existem na tabela `experiences`. A leitura no frontend continua normalizada sem interrupções.

### 2026-07-18: Fase EI-7 – Restrições aplicadas ao Roteiro e ao Consumer
**Contexto:** Com as 10 novas colunas de acessibilidade e políticas (ex: `min_age`, `wheelchair_accessible`, `adult_only`) inseridas na Fase EI-6, foi necessário forçar a Engine a interpretá-las objetivamente, evitando que a recomendação por afinidade ignorasse bloqueios vitais (ex: sugerir uma experiência `adult_only` para famílias).
**Decisão:** Uma nova etapa pura e determinística foi adicionada ao `ExperienceMatchingEngine.calculateScore`, baseada na função `evaluateRestrictions`. Esta avaliação categoriza cada restrição estrutural em `blockers`, `warnings` ou `information`, baseando-se no perfil expandido do usuário (`UserProfile` agora comporta idade, crianças, tamanho do grupo e uso de cadeira de rodas).
**Resultado:** 
1. Itens avaliados com `blockers` não podem mais ser adicionados ao Roteiro automaticamente.
2. Na UI do Catálogo, esses itens exibem o botão de "Adicionar" travado, com um banner vermelho "Restrito pelo Perfil".
3. Alertas menos críticos (`warnings` ou `information`) usam um banner âmbar.
4. Nenhuma modificação no banco foi feita. Toda a validação ocorre estritamente na Engine Frontend em memória.
5. Cobertura de 15 testes de unidade garantindo o comportamento lógico exato de bloqueio/alerta.

### 18. Viabilidade Logística (EI-8)
**Data:** 2026-07-19
**Decisão:** Adicionada validação de horários de funcionamento e deslocamento (`LogisticsEngine`) antes de adicionar experiências ao roteiro, impedindo que o motor sugira atrações fechadas no dia ou no horário, com fallback para ajustes de horário quando viável. Tudo na memória, usando as estruturas de schemas já existentes no DB (sem SQL run).
**Impacto:** Roteiros não contêm mais atrações temporalmente inviáveis ou fora de expediente.

## 2026-07-19: Viabilidade Logística (EI-8) e Ressalvas
- A Engine Logística (LogisticsEngine) avalia dias da semana, exceções e tempos de deslocamento (transit_options_origin).
- **Ressalva de UX para Trânsito**: Quando o deslocamento não existe na base (nulo), emitimos `TRANSIT_TIME_UNKNOWN`. Nesses casos, o horário no Roteiro é uma **estimativa aproximada** e não uma confirmação de viabilidade.
- **Ressalva de Edição Manual**: A EI-8 integra a logística no orquestrador `generateSmartItinerary`, porém a **preservação real da edição manual de roteiro pelo usuário** ainda não está completa. Testes atuais provaram a lógica apenas simulando um score alto via Mock. O refinamento absoluto da edição manual foi registrado como pendência para a próxima fase (EI-9).

## 2026-07-19: Edição manual e recálculo parcial (EI-9)
- Foi introduzido o conceito de `StopEditMetadata` no state do usuário, contendo flags como `locked`, `source` ("engine" ou "manual"), e `conflict`.
- Em vez de reescrever o roteiro inteiro via `generateSmartItinerary` em alterações manuais, foi criado um módulo `recalculateItinerary` que recalcula APENAS os conflitos de logística e restrições.
- Alterações manuais geram histórico local `itineraryHistory` no `TravelState` para viabilizar o botão "Desfazer".

## [ADMIN-1] Zero "Em Breve"
**Data:** Jul 19, 2026
**Contexto:** O Admin continha páginas sinalizadas como "Em breve", mockadas e com comportamento incerto. 
**Decisão:** Eliminar 100% de mocks destrutivos ou falsas funcionalidades no Admin. Páginas apoiadas em backend inexistente (Parceiros, Vendas, B2C Users, Analytics) deixam de exibir botões interativos e passam a exibir um alerta documentado com as lacunas exigidas. Páginas suportadas (Hospedagens, Eventos, Destinos, Tags, Personas, Regras) derivam seus estados do catálogo central. `ComingSoon.tsx` removido globalmente.


## [ADMIN-2B.1B] Bloqueada por ausência de ambiente PostgreSQL isolado
**Data:** Jul 20, 2026
**Contexto:** Preparar os módulos "Parciais" (Afiliados, Analytics, Parceiros, Vendas, Usuários) para consumir tabelas reais.
**Decisão:** Não alterar `experiences`. Criadas tabelas `system_settings`, `partners`, `orders`, `profiles` e `analytics_events`. Edge Function `admin-list-users` criada para acessar de forma segura o `auth.users` B2C para a UI administrativa. A ADMIN-2B.1A isola o pacote físico de homologação em SQL.
**Fatos Atuais**: Docker e PostgreSQL locais estão indisponíveis, impossibilitando a 2B.1B.
**Status Oficial**:
* ADMIN-2B.1A — Validação estática e pacote de homologação concluídos
* ADMIN-2B.1B — Bloqueada por ausência de ambiente PostgreSQL isolado
* ADMIN-2B.2 — Aplicação controlada no projeto real bloqueada


### Regra Permanente do Projeto
A padronização visual global será feita **somente** depois que estrutura, banco, integrações, mocks e fluxos estiverem concluídos. Até a fase de Design System (DESIGN-SYSTEM-1):
- Não redesenhar páginas ou trocar componentes por estética.
- Corrigir apenas o que impede o uso.

