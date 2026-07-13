# PRODUCT MASTER PLAN — VOYAGE FLOW
**Versão:** 1.2 — Julho 2026  
**Branch de referência:** `feature/restauracao-admin-completo`  
**Status:** Aguardando aprovação do Rafael antes de qualquer implementação.

---

## 1. VISÃO DO PRODUTO

### Proposta de Valor
O Voyage Flow é um **Concierge Digital Premium** que substitui o planejamento manual e fragmentado de viagens por uma experiência inteligente, personalizada e fluida — do primeiro clique até o último check-out.

Não somos uma OTA. Não somos um portal de busca. Não somos um aggregator.  
**Somos o assistente que entende o viajante, reúne o que ele já tem e constrói o restante da viagem ao redor disso.**

### Público-Alvo
- Viajantes solo, casais, famílias e grupos com perfis psicográficos distintos.
- Pessoas que planejam — não apenas reservam.
- Viajantes de alto e médio perfil que valorizam curadoria, mas rejeitam esforço manual.

### O Problema Resolvido
O planejamento de viagem atual é fragmentado: voos no Skyscanner, hotéis no Booking, atrações no TripAdvisor, restaurantes no Google Maps. O viajante passa horas reunindo informação e ainda assim chega ao destino sem um plano coerente.

### Diferença em relação a organizadores tradicionais
| Característica | TripAdvisor / Google Trips | Voyage Flow |
|---|---|---|
| Personalização | Genérica ou por rating | Baseada no perfil psicográfico do viajante |
| Fonte de dados | Crowdsourced, sem curadoria | Catálogo humano + IA curado manualmente |
| Roteiro | Lista de lugares | Roteiro com tempo, deslocamento, orçamento, ritmo |
| Integração | Não integra reservas | Reconhece o que já foi comprado e planeja ao redor |
| Inteligência | Score por popularidade | Score por afinidade + contexto + estação + budget |

### Dois Modos Principais

**Modo 1 — Planejar do Zero**  
Usuário não comprou nada. O app coleta o perfil via Onboarding (estilo Tinder), entende destino, datas, estilo e orçamento, e gera um roteiro completo com sugestões de hospedagem, atrações e restaurantes.

**Modo 2 — Organizar Viagem Já Iniciada**  
Usuário já tem voo e/ou hotel confirmados. O app "ancora" o roteiro nesses compromissos fixos e preenche o restante com curadoria inteligente — começando pela chegada no aeroporto.

---

## 2. FRONTEIRAS DO SISTEMA E PRECEDÊNCIA

É fundamental separar o que é universal do que é específico de cada viagem, respeitando a regra de que **o Admin guarda o padrão, e a Viagem guarda o contexto.**

### ADMIN / CATÁLOGO
Guarda **fatos reutilizáveis, objetivos e regras padrão** sobre locais, serviços e opções de transporte.
- **Tabelas centrais:** `destinations`, `experiences`, `operating_hours`, `operating_hour_exceptions`, `transit_options`
- **Tabelas de suporte:** `tags`, `personas`, `engine_configs`

### MINHA VIAGEM
Guarda **escolhas, contexto da viagem, e overrides** para as regras do Admin (reservas específicas, horários diferenciados).
- **Tabelas necessárias (futuras):** `trips`, `trip_items`, `commitments`, `user_profiles`

### ENGINE
Realiza **cálculos dinâmicos e estimativas** cruzando a Viagem com o Admin. Não armazena dados primários.
- **Responsabilidades:** Cálculos de rota exata, tempo de deslocamento real, encaixe, viabilidade e geração/regeneração de opções.

### CONTRATO DE PRECEDÊNCIA DOS DADOS

A regra de ouro da arquitetura é que **a reserva ou compromisso do usuário pode sobrescrever a regra do catálogo** quando o produto comprado for diferente. A Engine usa sempre o dado mais específico disponível na seguinte ordem de precedência:

1. **Reserva ou compromisso específico da viagem** (Ex: Check-in específico da reserva substitui check-in padrão do hotel; regra de bagagem da passagem substitui regra geral do modal de transporte).
2. **Exceção de Horário** (Ex: Horário excepcional por data em `operating_hour_exceptions` substitui o horário semanal de `operating_hours`).
3. **Dado estruturado do catálogo** (Ex: Horário semanal de `operating_hours` substitui qualquer estimativa genérica).
4. **Dado herdado do destino** (Ex: `timezone` ou `currency` herdado de `destinations`).
5. **Estimativa segura da Engine** (Ex: Engine estima 1h de buffer em aeroportos por via de regra, se não houver regra específica).
6. **Warning** (Emitido quando não houver informação confiável).

*Nota sobre metadados de qualidade:* Um dado verificado recentemente tem maior peso ou confiança (confidence level) do que um dado muito antigo.

---

## 3. MATRIZ DE PROPRIEDADE DOS DADOS

A tabela `experiences` continuará sendo a entidade central do catálogo no MVP. Não criaremos tabelas separadas para restaurantes, aeroportos ou hotéis. Todos usam `experiences` e recebem suporte de entidades relacionais auxiliares.

| Dado Operacional | Domínio Responsável | Formato Recomendado | Prioridade | Override pela Viagem? |
|---|---|---|---|---|
| **Funcionamento e Horários** | | | | |
| Fuso Horário (`timezone`) | `destination` | Herdado (Destination -> Exp) | Bloqueia MVP | Não (Exceto rara exceção de Exp) |
| Horários da semana | `operating_hours` | Tabela Relacionada | Bloqueia MVP | Sim (por evento fixo) |
| Horário da Cozinha / Última Entrada | `operating_hours` | Tabela Relacionada | Importante | Sim (por reserva) |
| Fechamentos temporários / Feriados | `operating_hour_exceptions`| Tabela Relacionada | Importante | Não |
| Duração Mín/Ideal/Máx | `experience` | Colunas | Bloqueia MVP | Sim (tempo alocado) |
| Margens (Buffer before/after) | `experience` | Colunas | Importante | Sim |
| Melhor hora do dia | `experience` | JSONB / Array | Importante | Não |
| Estimativa de fila típica | `experience` / `engine` | Coluna ou Calculado | Importante | Sim (Fast Pass) |
| **Alimentação e Infraestrutura** | | | | |
| Períodos de refeição | `experience` | JSONB / Array | Bloqueia MVP | Não |
| Totalmente / Parcialmente Indoor | `experience` | Coluna | Bloqueia MVP | Não |
| Compatível com chuva | `experience` | Coluna | Bloqueia MVP | Não |
| Acessibilidade | `experience` | JSONB / Array | Importante | Não |
| Adequação para Solo/Grupos | `experience` | JSONB / Array | Importante | Não |
| Política de bagagem/Guarda-volumes | `experience` | Coluna ou JSONB | Importante | Sim (Override na reserva) |
| **Comercial e Qualidade** | | | | |
| Moeda (`currency`) | `destination` | Herdado | Bloqueia MVP | Sim (em `transit_options` ou `trip`) |
| Preço base | `experience` | Coluna | Bloqueia MVP | Sim (preço real pago na reserva) |
| Horário flexível vs fixo | `experience` | Coluna (Boolean) | Bloqueia MVP | Sim (tipo de ticket comprado) |
| Disponibilidade Sazonal | `experience` | JSONB / Array | Importante | Não |
| Regras de cancelamento | `experience` | Texto / JSONB | Futuro | Sim (reserva específica) |
| Fonte do dado (`source_url`) | `quality metadata` | Coluna genérica | Importante | Não |
| Última verificação (`verified_at`) | `quality metadata` | Coluna de log temporal | Importante | Não |
| Nível de confiança do dado | `quality metadata` | Calculado / Coluna | Futuro | Não |
| **Logística e Deslocamento** | | | | |
| Opções modais de A para B | `transit_options` | Tabela Relacionada | Bloqueia MVP | Não (Fato universal) |
| Rota exata, trânsito e horário real | `engine` | Calculado | Bloqueia MVP | Não |
| Hospedagem base da viagem | `trip` | Coluna (Ref `experience` ou custom) | Bloqueia MVP | N/A (É próprio da viagem) |
| Passagens ou Transfer comprado | `commitment/reservation` | Tabela Relacionada à Viagem | Bloqueia MVP | Sim (É o override) |

---

## 4. MODELAGEM AVANÇADA DOS DADOS RELACIONAIS

### `operating_hours`
Deve ser uma entidade relacional com a capacidade de suportar:
- Vários intervalos no mesmo dia (ex: 11:00-15:00 almoço e 19:00-23:00 jantar).
- Período normal vs fechamento de cozinha vs última entrada.
- Funcionamento 24h ou dias totalmente fechados.
- `timezone` implicitamente herdado do `destination` da experiência.
- Validade sazonal opcional (ex: horários de verão vs inverno).

### `operating_hour_exceptions`
Substitui a ideia de um `temporary_closure` booleano por um registro semântico do tipo de exceção, contendo:
- `experience_id`
- `date` ou período de datas
- `status` (`closed`, `modified_hours`, `special_opening`)
- `opens_at` (nullable)
- `closes_at` (nullable)
- `last_entry_at` (nullable)
- `reason` (nullable)
- `source_url`
- `verified_at`

### `transit_options`
Distingue claramente o que é "catálogo" do que é "cálculo dinâmico".

**DADOS DO ADMIN (`transit_options`):**
- Origem ou zona de origem.
- Destino ou zona atendida.
- Modalidade (trem, metrô, etc).
- Preço estimado e moeda (`currency`).
- Duração estimada mínima, média e máxima.
- Frequência (ex: a cada 15 min).
- Período de operação (ex: 24h ou horário de trem).
- Número de baldeações.
- Adequação para malas, acessibilidade, necessidade de reserva e instruções.
- Fonte e verificação.

**CÁLCULOS DA ENGINE (Para a viagem específica):**
- Rota exata e distância exata (usando APIs como Google Maps).
- Horário real de saída, duração até o hotel/endereço escolhido.
- Impacto do trânsito no momento e comparação/rankeamento entre as opções.

---

## 5. HOSPEDAGEM E COMPROMISSOS PERSONALIZADOS

O roteiro da "Minha Viagem" precisa lidar com âncoras logísticas flexíveis. O usuário **não pode** ser forçado a escolher apenas hotéis ou voos que já existam na nossa tabela `experiences` ou `transit_options`.

A tabela da viagem (`commitments` ou equivalente) deve suportar **duas formas de âncora**:
1. **Referência ao Catálogo:** O usuário escolhe um item via ID. A Engine consome os dados oficiais do Admin (com possíveis overrides aplicados).
2. **Registro Personalizado (Custom):** O usuário informa que vai ficar na casa de um amigo. O sistema armazena o nome customizado, endereço (coords), check-in/out daquele caso, e notas pessoais.

---

## 6. PERSISTÊNCIA DO ROTEIRO

O sistema da Engine é uma calculadora dinâmica, mas o seu **resultado deve ser salvo e persistido** para o usuário.

**Regras de Persistência:**
- As recomendações podem ser recalculadas.
- O roteiro gerado e aprovado pelo usuário deve ser persistido.
- Alterações manuais, itens bloqueados (locked) e versões anteriores precisam ser preserváveis.
- A regeneração deve poder afetar apenas uma parte do roteiro, mantendo o restante intacto.

**Proposta Conceitual de Tabelas (Não implementar agora):**
- `itinerary_versions`
- `itinerary_days`
- `itinerary_items`

---

## 7. INVENTÁRIO DO QUE JÁ EXISTE E FOI APROVADO

O código preexistente na branch `feature/restauracao-admin-completo` forma o baseline inegociável:
- `short_description` continua sendo texto editorial. Nunca JSON.
- `intelligence_metadata` continua como JSONB.
- Campos estruturados têm prioridade e não são duplicados no JSONB.
- Escala canônica `0–1` na base; UI converte para `0–100`.
- **Fase 1A Concluída:** ExperienceRepository, testes determinísticos, ExperienceEditor carregando/salvando dados base, e sincronização de tipos Supabase.

---

## 8. ROADMAP DEFINITIVO

A ordem oficial e inegociável das próximas fases.

### FASE 1A — Fundação técnica do ExperienceEditor
**Status:** ✅ Concluída.

### FASE 1B — Contrato final dos dados do Admin
**Objetivo:** Fechar o modelo de dados para as lacunas (horários relacionais, matriz de propriedade) sem necessariamente implementar a interface (UI).
**Critério de Saída:** Schemas SQL fechados, migrations incrementais definidas, contratos TypeScript atualizados, Repository desenhado, critérios de compatibilidade e plano técnico final apresentado e aprovado antes da execução real.

### FASE 2 — Implementação dos Módulos Operacionais do Admin
**Objetivo:** Execução do banco (migrations) e construção da interface no Admin para os novos campos de funcionamento, horários e transporte.
**Critério de Saída:** O painel interno permite o cadastro robusto de horários, exceções e dados modais do catálogo.

### FASE 3 — Cadastro e Validação de Casos Completos
**Objetivo:** Preenchimento de dados reais para 10-15 itens cruciais de NYC (atrações, aeroporto, hotel).
**Critério de Saída:** Banco populado e íntegro, sem dados simulados.

### FASE 4 — Estrutura de Minha Viagem em Modo Guest
**Objetivo:** Persistência do roteiro (identificador local seguro) sem exigir autenticação completa para não bloquear o MVP.
**Critério de Saída:** Roteiros são salvos no banco, associáveis a uma sessão ou link compartilhável, com associação de conta possível posteriormente.

### FASE 5 — Compromissos, Hospedagem e Itens Confirmados/Desejados
**Objetivo:** O usuário fornece os overrides e âncoras (hotel customizado, voo comprado).
**Critério de Saída:** O sistema armazena a hospedagem exata e as restrições logísticas da viagem.

### FASE 6 — Engine Logística
**Objetivo:** A Engine cruza o Catálogo com a Viagem, resolvendo horários, aberturas, buffers e rotas geográficas.
**Critério de Saída:** Devolução de um array roteirizado cronologicamente que suporta todas as lógicas complexas aprovadas.

### FASE 7 — Persistência e Edição do Roteiro
**Objetivo:** Interface do Roteiro Gerado (Timeline/Mapas), com travamento e swaps.
**Critério de Saída:** Usuário pode editar, persistindo no modelo `itinerary_items`.

### FASE 8 — Conta, Sincronização e Recursos Avançados
**Objetivo:** Conversão completa de usuários Guest para Logados, afiliados e Analytics.
**Critério de Saída:** Usuário autenticado oficialmente.

---

## 9. CASOS DE TESTE ANTES DE IMPLEMENTAR

O MVP deve cobrir os seguintes cenários de validação pela Engine:
1. Viagem criada totalmente do zero.
2. Viagem com voo e hotel comprados (âncoras fixas).
3. Hospedagem fora do catálogo (custom).
4. Atração sugerida, porém fechada no dia desejado.
5. Atividade com horário fixo (reserva num horário restrito).
6. Chegada cedo (antes do check-in do hotel).
7. Hotel sem guarda-volumes (exigindo busca por solução local).
8. Usuário em trânsito com malas (priorizando opções acessíveis logísticamente).
9. Previsão de chuva ativando fallback `rain_suitability`.
10. Atraso no voo requerendo reajuste dinâmico.
11. Mudança manual de uma atividade e reencaixe logístico subsequente.
12. Regeneração somente de uma manhã (mantendo tarde estática).
13. Orçamento excedido e busca por substitutos econômicos.
14. Restaurante fechado no horário requerido ou cozinha já encerrada.
15. Deslocamento inviável fisicamente na janela alocada.
16. Retorno ao aeroporto com margem de segurança e buffer_before calculado rigorosamente.

---

## 10. REGRAS DE PROTEÇÃO DO PROJETO

1. **Migrations sempre incrementais.** Nunca `DROP`, sempre `ADD COLUMN IF NOT EXISTS`.
2. **Nunca apagar dados existentes.** Registros em produção devem ser preservados intocados.
3. **Nunca reutilizar campo legados com novos significados.**
4. **Campos novos obrigatoriamente `nullable`.** Nenhum default obrigatório que quebre a base.
5. **Commits isolados por responsabilidade.** Um commit = uma mudança lógica.
6. **Rollback documentado.**
7. **Testes antes de avançar.** Build limpo, sem erros de tipagem.
8. **Documentação Vivia:** Atualizar os docs base ao fim de cada Fase.
9. **LGTM Obrigatório:** Nenhuma fase começa sem aprovação direta do Rafael.
10. **Proibido "Shadow features":** Toda ideia nova passa antes por um doc de design ou issue, nunca código oculto.

---

## 11. DECISÕES JÁ APROVADAS

As seguintes diretrizes estratégicas e técnicas foram aprovadas para o projeto e não voltarão à discussão:

- **Horários:** Serão relacionais (tabelas `operating_hours` e `operating_hour_exceptions`), eliminando o uso de JSON simplista.
- **Transporte:** Terá entidade própria estática (`transit_options`).
- **Catálogo MVP:** A tabela `experiences` continuará sendo o núcleo central (abrigando restaurantes, hotéis, atrações e modais genéricos).
- **Dados:** O Admin fornece os **fatos e padrões**; a Viagem fornece o **contexto e os overrides**.
- **Cálculo:** A Engine usa o catálogo e a viagem para calcular as rotas reais e a viabilidade cronológica.
- **Armazenamento:** O roteiro gerado e aprovado pelo usuário deverá ser fisicamente persistido (e suportará regenerações parciais).
- **Autenticação:** O sistema priorizará um "Modo Guest" robusto para viabilizar o teste do MVP e salvar escolhas, deixando o Auth para uma etapa avançada.

---
*Documento atualizado em 13/07/2026. Próxima revisão: após aprovação do Rafael e início da Fase 1B.*
