**VOYAGE FLOW**

**Documento Mestre do Admin**

**Versão 3.0 consolidada**

UX, arquitetura visual, campos por negócio, importação, inteligência,
segurança e plano de implementação

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>STATUS DESTA VERSÃO<br />
</strong>Documento fechado para orientar o Antigravity. Visual e
comportamento devem seguir esta especificação; imagens servem como
referência, mas o texto prevalece em caso de conflito.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Base consolidada a partir do Documento Mestre v1.0, do Plano Técnico
v2, das decisões aprovadas em conversa, dos testes reais do Admin e das
referências visuais produzidas para Dashboard, Catálogo, Editor e
Inteligência.**

Julho de 2026 · Proprietário do produto: Rafael Gomes

# 0. Como usar este documento

Este documento é a fonte oficial para evolução do Admin. Ele não
autoriza uma reforma integral em uma única entrega. Cada fase deve ser
executada separadamente, validada manualmente e versionada antes da
próxima.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>REGRA DE OURO<br />
</strong>O Antigravity implementa; não reinventa. Nenhuma funcionalidade
pode ser removida para esconder erro. Nenhuma tela é considerada pronta
sem persistência real, segurança, teste automático e teste manual.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## Conteúdo

1.  1\. Estado atual protegido e decisões congeladas

2.  2\. Princípios do Admin e responsabilidades de cada módulo

3.  3\. Design system oficial e cabeçalho contextual

4.  4\. Arquitetura de navegação

5.  5\. Dashboard inteligente

6.  6\. Analytics e Qualidade

7.  7\. Catálogo Mestre e páginas por segmento

8.  8\. Editor contextual com prévia fixa

9.  9\. Campos comuns e matrizes por tipo

10. 10\. Importação por URL e governança de origem

11. 11\. Taxonomias controladas

12. 12\. IA Concierge, Perfil do Viajante e Engine

13. 13\. Persistência, schema, migrations e segurança

14. 14\. Plano de implementação por fases

15. 15\. Critérios de aceite e regras contra regressão

16. 16\. Referências visuais oficiais

# 1. Estado atual protegido e decisões congeladas

O trabalho já validado deve ser preservado. O V3 parte da base existente
e corrige lacunas sem reabrir decisões aprovadas.

## 1.1 Base técnica protegida

| **Área**                            | **Situação validada**                                                                       | **Regra V3**                                                                             |
|-------------------------------------|---------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Autenticação Admin                  | Login por e-mail/senha funcionando; migration 000006 aplicada; usuário administrador ativo. | Preservar. Ainda falta frontend consultar public.is_admin() e auditoria completa de RLS. |
| CREATE/EDIT de experiências         | Criar, abrir, editar e salvar dados básicos foi validado.                                   | Commit 21a92bf. Não regredir.                                                            |
| Rotas seguras                       | Create, edit e invalid diferenciados; update exige UUID válido.                             | Não usar fallback de rota inválida para create.                                          |
| Filtros de Hospedagens/Restaurantes | Classificação usa tipo técnico com fallback legado.                                         | Commit 71a1d7c. Preservar até taxonomia definitiva.                                      |
| Importar por URL                    | Botão e fluxo existentes.                                                                   | Não remover; será reformado em fase própria.                                             |
| IA Concierge visual                 | Seção existe no editor.                                                                     | Não remover; persistência e cálculo ainda precisam de reforma.                           |
| Migrations 000001–000005            | Versionadas, não aplicadas.                                                                 | Aplicar somente após auditoria, backup e autorização individual.                         |

## 1.2 Decisões visuais congeladas

- Verde-limão vivo é a assinatura principal; rosa/magenta, lilás, azul e
  menta são acentos semânticos.

- Todas as páginas usam cabeçalho contextual consistente, baseado em
  cor, gradiente e formas abstratas; fotografias não são a base do
  header.

- Menu lateral mantém todas as áreas encontráveis, organizadas em grupos
  de sanfona.

- Catálogo oferece Tabela, Lista e Cards. Cada modo serve a uma
  necessidade operacional distinta.

- Editor usa formulário à esquerda e prévia ao vivo fixa à direita.

- Hotel, hostel, apartamento, restaurante, café, bar, atração, museu,
  parque, tour, evento e logística não compartilham um formulário
  genérico.

- Dashboard prioriza; Qualidade corrige; Analytics explica tendências e
  causas.

# 2. Princípios do Admin e responsabilidades de cada módulo

O Admin é um centro de operação, inteligência e monetização. Ele não é
apenas um formulário e não deve exibir números sem contexto ou ações.

| **Módulo**        | **Pergunta respondida**                             | **Função principal**                                   |
|-------------------|-----------------------------------------------------|--------------------------------------------------------|
| Dashboard         | O que está acontecendo agora e o que exige atenção. | Visão executiva, prioridades e atalhos.                |
| Analytics         | Por que aconteceu e como evolui.                    | Tendências, funis, comparação e causas.                |
| Catálogo          | Onde está o inventário e como operá-lo.             | Busca, filtros, ações em lote, mapa e edição.          |
| Editor            | Como criar e validar um item.                       | Campos contextuais, importação, qualidade e prévias.   |
| Qualidade         | O que está incompleto, incoerente ou quebrado.      | Diagnóstico profundo e correção em massa.              |
| IA Concierge      | Para quem recomendar, por quê e com qual confiança. | Fatos, scores, razões, lacunas e overrides.            |
| Receita           | Como o produto monetiza.                            | Planos Pro, afiliados, parceiros, conversões e vendas. |
| Usuários/Controle | Quem acessa e o que pode fazer.                     | Permissões, auditoria, sessões e configuração.         |

## 2.1 Princípios não negociáveis

- Fatos estruturados vêm antes de scores.

- Labels podem estar em português; valores técnicos persistidos são
  canônicos e estáveis.

- Texto livre é reservado a conteúdo editorial, endereço e observações —
  nunca a campos que controlam filtros ou Engine.

- Dados extraídos, sugeridos pela IA e confirmados pelo administrador
  são estados diferentes.

- Rascunho tolera pendências; publicação exige contrato mínimo por tipo.

- Nenhum dado ausente deve ser inventado para “completar” a tela.

- Nenhuma alteração de banco acontece sem migration versionada, backup,
  teste e rollback.

# 3. Design system oficial e cabeçalho contextual

A linguagem visual deve ser vibrante, premium e consistente, sem
aparência infantil nem template SaaS genérico.

## 3.1 Paleta oficial

| **Token**        | **Hex**  | **Uso**                                                       |
|------------------|----------|---------------------------------------------------------------|
| Lime principal   | \#D7F24B | Ação primária, item ativo, oportunidade, assinatura da marca. |
| Lime intenso     | \#C5EA27 | Hover, foco e destaques compactos.                            |
| Rosa vibrante    | \#FF4FC3 | Alertas de conversão, inteligência, acentos de produto.       |
| Lilás            | \#8A73FF | IA, sugestão e conteúdo calculado.                            |
| Azul suave       | \#77B8FF | Dado extraído e informação geográfica.                        |
| Menta            | \#BDF4D6 | Confirmação, sucesso e dado validado.                         |
| Amarelo suave    | \#FFE7A8 | Pendência e atenção média.                                    |
| Off-white        | \#F7F7F2 | Fundo geral.                                                  |
| Branco           | \#FFFFFF | Superfícies e cards.                                          |
| Ink              | \#171717 | Texto principal.                                              |
| Cinza secundário | \#6F7280 | Texto de apoio.                                               |

## 3.2 Regras de composição

- Proporção visual aproximada: 70% neutros, 20% lime e 10%
  rosa/lilás/cores semânticas.

- Raios: 16 px em controles, 20–24 px em cards, 24–28 px em cabeçalhos
  contextuais.

- Bordas finas, sombras suaves e espaçamento baseado em múltiplos de 8
  px.

- Fotografias podem existir nos cards de conteúdo e prévias; não devem
  dominar o Dashboard nem o cabeçalho contextual.

- Contraste mínimo WCAG AA para texto e controles; lime nunca recebe
  texto branco pequeno.

## 3.3 Cabeçalho contextual obrigatório

Todas as telas principais usam o mesmo esqueleto: identificação da área,
título, descrição, contexto e ações. A cor muda por módulo; a estrutura
não.

| **Tela**     | **Cores**             | **Label contextual** | **Ações principais**                |
|--------------|-----------------------|----------------------|-------------------------------------|
| Dashboard    | Lime + rosa           | Centro de Operações  | Nova experiência / Importar por URL |
| Catálogo     | Lime + menta          | Centro Operacional   | Novo item / Importar por URL        |
| Editor       | Lilás + azul          | Conteúdo em edição   | Salvar rascunho / Publicar          |
| Inteligência | Rosa + lilás          | Leitura da Engine    | Sincronizar / Restaurar cálculo     |
| Qualidade    | Amarelo + coral       | Central de Qualidade | Corrigir lote / Exportar            |
| Receita      | Lime + verde profundo | Monetização          | Novo parceiro / Ver vendas          |

# 4. Arquitetura de navegação

Todas as áreas continuam visíveis, organizadas em sanfonas. O grupo da
rota atual permanece aberto e o estado pode ser lembrado por usuário.

| **Grupo**    | **Itens**                                                                |
|--------------|--------------------------------------------------------------------------|
| GERAL        | Dashboard; Analytics                                                     |
| CONTEÚDO     | Catálogo; Hospedagens; Restaurantes; Eventos; Destinos; Importar por URL |
| INTELIGÊNCIA | Qualidade; IA Concierge; Tags; Personas; Regras da Engine                |
| RECEITA      | Parceiros; Afiliados; Vendas; Assinaturas/Planos                         |
| CONTROLE     | Usuários; Funções e permissões; Configurações; Auditoria                 |

- Badges mostram contagem real de pendências; “novo” só em lançamento
  real.

- Busca global encontra experiência, destino, parceiro, usuário e tarefa
  de qualidade.

- Breadcrumb contextual: Conteúdo › Hospedagens › HI New York City
  Hostel.

- Rodapé do menu: perfil, função, recolher e sair.

- No mobile futuro, o menu vira drawer; a especificação atual é
  desktop-first.

# 5. Dashboard inteligente

O Dashboard mostra o negócio inteiro: produto, usuários, viagens,
assinaturas, receita, operação editorial, qualidade e IA. Ele não
substitui Analytics nem Qualidade.

## 5.1 KPIs principais

| **Indicador**   | **Métrica**                         | **Contexto obrigatório**               |
|-----------------|-------------------------------------|----------------------------------------|
| Downloads       | Instalações totais e por plataforma | Período, variação, fonte de atribuição |
| Usuários        | Cadastrados, ativos, retenção       | DAU/WAU/MAU e comparação               |
| Viagens         | Criadas e concluídas                | Conclusão, abandono e tipo de entrada  |
| Assinaturas Pro | Ativas, novas e canceladas          | MRR, conversão e churn                 |
| Receita         | Planos, afiliados e parceiros       | Período, meta e comparação             |
| Conversão       | Gratuito → Pro e clique → venda     | Funil e parceiro                       |

## 5.2 Blocos do Dashboard

| **Bloco**           | **Conteúdo**                                                                                |
|---------------------|---------------------------------------------------------------------------------------------|
| Produto e Usuários  | Downloads, usuários ativos, retenção, viagens criadas/concluídas, destinos mais planejados. |
| Vendas e Receita    | Assinaturas Pro, MRR, afiliados, vendas, conversão, ticket médio, cancelamentos.            |
| Cadastros e Edições | Publicados, rascunhos, novos cadastros, importações e últimas edições.                      |
| Qualidade e Erros   | Sem foto, sem horários, sem preço, links quebrados, dados incompletos.                      |
| Saúde da IA         | Confiáveis, neutros, sem pesos, conflitos de taxonomia e baixa confiança.                   |
| Prioridades de hoje | Fila priorizada por impacto, urgência e facilidade de correção.                             |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>DIVISÃO DE RESPONSABILIDADE<br />
</strong>Dashboard avisa e prioriza. Qualidade investiga e corrige.
Analytics explica comportamento, tendência e causa.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 6. Analytics e Qualidade

## 6.1 Analytics

- Funil: instalação → cadastro → onboarding → roteiro → viagem concluída
  → assinatura.

- Comportamento: visualizações, swipe, salvos, descartes e inclusão em
  roteiro.

- Desempenho por destino, tipo técnico, persona, dispositivo, origem e
  parceiro.

- Itens com score alto e engajamento baixo: possível falha de conteúdo
  ou Engine.

- Tendências e comparações entre períodos; nunca apenas a fotografia do
  momento.

## 6.2 Qualidade

| **Dimensão** | **O que verifica**                                      |
|--------------|---------------------------------------------------------|
| Conteúdo     | Título, descrição, mídia, localização, preço, horários. |
| Taxonomia    | Tipo, categoria, tags e personas canônicas.             |
| Operação     | Reserva, duração, fila, check-in/out, exceções.         |
| Inteligência | Fatos suficientes, confiança, razões e conflitos.       |
| Monetização  | Parceiro, link, comissão, preço e disponibilidade.      |
| Origem       | Fonte, data de coleta, confirmação e validade.          |

- Permitir filtros por problema e correção em lote.

- Mostrar score, impacto e motivo do bloqueio de publicação.

- Não ocultar item incompleto; mostrar pendência e rota de correção.

# 7. Catálogo Mestre e páginas por segmento

O Catálogo é o centro operacional do inventário e oferece três modos,
cada um com função própria.

| **Modo** | **Objetivo**                                      | **Mapa**                                    |
|----------|---------------------------------------------------|---------------------------------------------|
| Tabela   | Operação densa, comparação e ações em lote.       | Mapa recolhido por padrão; drawer opcional. |
| Lista    | Equilíbrio entre contexto visual e produtividade. | Mapa opcional e sincronizado.               |
| Cards    | Curadoria visual, leitura rápida e localização.   | Mapa lateral aberto e sincronizado.         |

## 7.1 Colunas e sinais operacionais

- Seleção; mídia; título e categoria editorial; tipo técnico;
  destino/bairro; status; qualidade; IA; monetização; atualizado; ações.

- Sinais: sem foto, sem afiliado, IA fraca, conflito de taxonomia,
  origem não revisada, link quebrado.

- Ações em lote: publicar, arquivar, adicionar tags, revisar qualidade,
  atribuir parceiro, exportar.

- Itens sem coordenadas permanecem na lista e recebem alerta “sem
  localização”.

## 7.2 Filtros

- Busca; tipo técnico; categoria editorial; destino; bairro; status;
  qualidade; IA; monetização; origem; preço; nota; atualização.

- Filtros ativos têm contagem e botão “Limpar filtros”.

- Tipo técnico tem prioridade; categoria editorial não identifica
  segmento técnico.

## 7.3 Páginas por segmento

| **Página**            | **Tipos técnicos**                                 |
|-----------------------|----------------------------------------------------|
| Hospedagens           | hotel, hostel, apartment e equivalentes canônicos  |
| Restaurantes          | restaurant, cafe, bar                              |
| Eventos               | event, festival, concert                           |
| Atrações (futura aba) | attraction, museum, park, tour, theater, viewpoint |

# 8. Editor contextual com prévia fixa

O Editor usa progressive disclosure: base comum + módulos por tipo. O
formulário fica à esquerda e a prévia sticky à direita.

| **Área**        | **Conteúdo**                                                                                                          |
|-----------------|-----------------------------------------------------------------------------------------------------------------------|
| Coluna esquerda | Importação; identidade; classificação; localização; operação; preço; mídia; campos por tipo; inteligência; qualidade. |
| Coluna direita  | Prévia de card no roteiro, swipe, catálogo e Admin; mobile/desktop; checklist de publicação.                          |
| Topo            | Cabeçalho contextual; salvar rascunho; publicar; status de salvamento; origem.                                        |

- Rascunho aceita pendências; publicação valida contrato específico do
  tipo.

- Campos ausentes mostram placeholder e pendência, nunca dado inventado.

- Mudar tipo técnico exige confirmação se campos específicos serão
  ocultados ou invalidados.

- Tipo, categoria, tags e personas usam controles de biblioteca, não
  texto livre.

- Prévia atualiza título, imagem, preço, duração, badges e descrição em
  tempo real.

# 9. Campos comuns e matrizes por tipo

As matrizes a seguir definem o comportamento funcional. O nome físico
final das colunas depende da auditoria de schema; o Antigravity não pode
improvisar persistência em JSONB para evitar migration.

## 9.1 Campos comuns

| **Campo**              | **Controle**      | **Obrig. publicar**  | **Origem**             | **Persistência**                |
|------------------------|-------------------|----------------------|------------------------|---------------------------------|
| Título                 | Texto             | Sim                  | Fonte/manual           | Banco atual                     |
| Destino                | Select real       | Sim                  | Nunca inferir UUID     | FK destinations                 |
| Categoria editorial    | Select controlado | Sim                  | Sugestão + confirmação | Taxonomia canônica              |
| Tipo técnico           | Select controlado | Sim                  | Sugestão + confirmação | Coluna/migration após auditoria |
| Descrição principal    | Textarea          | Sim                  | Extraível/editável     | Texto editorial                 |
| Descrição curta        | Textarea          | Sim                  | Extraível/editável     | Nunca JSON                      |
| Endereço e coordenadas | Busca/mapa        | Conforme tipo        | Fonte oficial/Maps     | Campos estruturados             |
| Mídia                  | Galeria           | Sim para publicar    | Fonte + confirmação    | Tabela/array aprovado           |
| Preço base             | Moeda             | Conforme tipo        | Fonte + validade       | Campo estruturado               |
| Booking URL            | URL               | Opcional/monetização | Fonte/parceiro         | Campo URL                       |
| Status                 | Select            | Sim                  | Manual                 | draft/published/archived        |
| Origem do dado         | Badge/auditoria   | Sim após importação  | Automático             | Tabela de proveniência          |

## 9.2 Hotel

| **Campo**                           | **Controle**             | **Obrig.**    | **Origem**           | **Uso/Persistência**               |
|-------------------------------------|--------------------------|---------------|----------------------|------------------------------------|
| Classificação/estrelas              | Select                   | Recomendado   | Booking/site oficial | Engine e filtros                   |
| Check-in                            | Time                     | Sim           | Site/Booking         | Campo próprio; não operating_hours |
| Check-out                           | Time                     | Sim           | Site/Booking         | Campo próprio                      |
| Tipos de quarto                     | Tabela                   | Sim           | Booking/site         | Tabela relacional                  |
| Capacidade e camas                  | Tabela/número            | Sim           | Fonte + confirmação  | Engine                             |
| Banheiro privativo                  | Toggle                   | Sim           | Fonte + confirmação  | Engine                             |
| Café da manhã                       | Select                   | Sim           | Fonte + confirmação  | Filtro/Engine                      |
| Comodidades                         | Multiselect              | Recomendado   | Fonte + revisão      | Taxonomia                          |
| Política infantil                   | Select/texto estruturado | Sim           | Site oficial         | Engine                             |
| Pet friendly                        | Toggle/regras            | Recomendado   | Site oficial         | Filtro                             |
| Taxas e resort fee                  | Moeda/regras             | Sim se houver | Fonte oficial        | Custo real                         |
| Estacionamento/academia/spa/piscina | Multiselect              | Opcional      | Fonte                | Filtro/Engine                      |

## 9.3 Hostel

| **Campo**                 | **Controle**  | **Obrig.**   | **Origem**          | **Uso/Persistência** |
|---------------------------|---------------|--------------|---------------------|----------------------|
| Dormitório compartilhado  | Toggle        | Sim          | Fonte + confirmação | Engine               |
| Quarto privativo          | Toggle        | Sim          | Fonte + confirmação | Engine               |
| Dormitório misto/feminino | Multiselect   | Recomendado  | Fonte               | Engine               |
| Camas e lockers           | Número/toggle | Sim          | Fonte               | Operação             |
| Banheiro compartilhado    | Toggle        | Sim          | Fonte               | Privacidade          |
| Cozinha coletiva          | Toggle        | Recomendado  | Fonte               | Perfil               |
| Área/eventos sociais      | Select        | Recomendado  | Fonte/IA sugerida   | Socialização         |
| Nível de socialização     | Select        | Sim          | Admin confirma      | Engine               |
| Nível de privacidade      | Select        | Sim          | Admin confirma      | Engine               |
| Limite de idade           | Faixa/regra   | Se aplicável | Fonte oficial       | Publicação           |
| Aceita crianças           | Select        | Sim          | Fonte oficial       | Família              |
| Ambiente festa/tranquilo  | Select        | Recomendado  | Fonte/confirmado    | Solo/amigos          |

## 9.4 Apartamento / aluguel por temporada

| **Campo**               | **Controle**     | **Obrig.**    | **Origem**    | **Uso/Persistência** |
|-------------------------|------------------|---------------|---------------|----------------------|
| Tipo de imóvel          | Select           | Sim           | Fonte         | Filtro               |
| Quartos e camas         | Número/tabela    | Sim           | Fonte         | Capacidade           |
| Capacidade total        | Número           | Sim           | Fonte         | Engine               |
| Cozinha equipada        | Toggle           | Recomendado   | Fonte         | Família/long stay    |
| Estadia mínima          | Número/noites    | Sim           | Fonte         | Viabilidade          |
| Auto check-in           | Toggle/instrução | Recomendado   | Fonte         | Operação             |
| Taxa de limpeza         | Moeda            | Sim se houver | Fonte         | Custo                |
| Depósito/caução         | Moeda/regra      | Se houver     | Fonte         | Custo                |
| Regras do imóvel        | Checklist/texto  | Sim           | Fonte oficial | Publicação           |
| Lavanderia              | Toggle           | Opcional      | Fonte         | Long stay            |
| Elevador/acessibilidade | Toggle/regras    | Recomendado   | Fonte         | Filtro               |
| Política infantil/pet   | Select           | Sim           | Fonte         | Engine               |

## 9.5 Restaurante

| **Campo**                   | **Controle**      | **Obrig.**  | **Origem**          | **Uso/Persistência** |
|-----------------------------|-------------------|-------------|---------------------|----------------------|
| Culinária principal         | Select            | Sim         | Site/Maps           | Taxonomia/Engine     |
| Culinárias secundárias      | Multiselect       | Opcional    | Fonte + confirmação | Taxonomia            |
| Períodos de refeição        | Multiselect       | Sim         | Fonte               | meal_periods         |
| Tipo de serviço             | Select            | Sim         | Fonte               | Filtro               |
| Ticket médio/faixa de preço | Moeda/select      | Sim         | Fonte + validade    | Orçamento            |
| Reserva                     | Select            | Sim         | Fonte               | booking_time_mode    |
| Dress code                  | Select            | Recomendado | Fonte               | Perfil               |
| Ambiente/ocasião            | Multiselect       | Sim         | Fonte/IA sugerida   | Engine               |
| Opções alimentares          | Multiselect       | Recomendado | Fonte               | Filtro               |
| Tempo médio da refeição     | Número            | Recomendado | Estimativa revisada | Planejamento         |
| Taxa de serviço             | Regra             | Se houver   | Fonte               | Custo                |
| Prato recomendado           | Texto estruturado | Opcional    | Curadoria           | Conteúdo             |

## 9.6 Café

| **Campo**                  | **Controle** | **Obrig.**  | **Origem** | **Uso/Persistência** |
|----------------------------|--------------|-------------|------------|----------------------|
| Especialidade              | Select       | Sim         | Fonte      | Categoria            |
| Café da manhã/brunch       | Multiselect  | Sim         | Fonte      | Filtro               |
| Confeitaria/padaria        | Multiselect  | Recomendado | Fonte      | Filtro               |
| Opções de café             | Multiselect  | Opcional    | Fonte      | Conteúdo             |
| Espaço para trabalhar      | Select       | Recomendado | Curadoria  | Persona              |
| Wi-Fi e tomadas            | Toggle       | Recomendado | Fonte      | Filtro               |
| Tempo de permanência       | Número/faixa | Recomendado | Curadoria  | Roteiro              |
| Fila típica                | Número       | Opcional    | Estimativa | Operação             |
| Takeout                    | Toggle       | Recomendado | Fonte      | Filtro               |
| Ambiente silencioso/social | Select       | Recomendado | Curadoria  | Engine               |

## 9.7 Bar / nightlife

| **Campo**               | **Controle** | **Obrig.**    | **Origem**    | **Uso/Persistência** |
|-------------------------|--------------|---------------|---------------|----------------------|
| Tipo de bar             | Select       | Sim           | Fonte         | Taxonomia            |
| Carta de bebidas        | Multiselect  | Recomendado   | Fonte         | Conteúdo             |
| Faixa de preço          | Select       | Sim           | Fonte         | Orçamento            |
| Reserva/porta           | Select       | Sim           | Fonte         | Viabilidade          |
| Dress code              | Select       | Sim           | Fonte         | Perfil               |
| Música/DJ/ao vivo       | Multiselect  | Recomendado   | Fonte         | Persona              |
| Rooftop/vista           | Toggle       | Opcional      | Fonte         | Visual               |
| Faixa etária            | Regra        | Sim se houver | Fonte oficial | Publicação           |
| Horário de pico         | Faixa        | Recomendado   | Curadoria     | Roteiro              |
| Ambiente festa/conversa | Select       | Sim           | Curadoria     | Engine               |
| Consumo mínimo          | Moeda/regra  | Se houver     | Fonte         | Custo                |
| Última entrada          | Hora         | Recomendado   | Fonte         | Operação             |

## 9.8 Atração turística

| **Campo**                    | **Controle** | **Obrig.**  | **Origem**          | **Uso/Persistência** |
|------------------------------|--------------|-------------|---------------------|----------------------|
| Tipo de atração              | Select       | Sim         | Fonte               | Taxonomia            |
| Duração ideal                | Número       | Sim         | Fonte/curadoria     | Roteiro              |
| Ingresso/reserva             | Select       | Sim         | Fonte               | Viabilidade          |
| Preço                        | Moeda        | Se pago     | Fonte + validade    | Custo                |
| Fila típica                  | Número       | Recomendado | Estimativa revisada | Operação             |
| Indoor/outdoor               | Select       | Sim         | Fonte/confirmado    | Clima                |
| Dependência do clima         | Multiselect  | Sim         | Curadoria           | Engine               |
| Esforço físico               | Select       | Sim         | Curadoria           | Engine               |
| Melhor horário               | Faixa        | Recomendado | Curadoria           | Roteiro              |
| Faixa etária                 | Select       | Recomendado | Fonte               | Família              |
| Acessibilidade               | Checklist    | Recomendado | Fonte oficial       | Filtro               |
| Must see / ponto fotográfico | Toggle/tags  | Opcional    | Curadoria           | Visual               |

## 9.9 Museu

| **Campo**                          | **Controle** | **Obrig.**  | **Origem**    | **Uso/Persistência** |
|------------------------------------|--------------|-------------|---------------|----------------------|
| Tipo de acervo                     | Multiselect  | Sim         | Fonte         | Taxonomia            |
| Exposições permanentes/temporárias | Tabela       | Recomendado | Fonte         | Conteúdo             |
| Última entrada                     | Hora         | Sim         | Fonte oficial | Operação             |
| Audioguia                          | Multiselect  | Recomendado | Fonte         | Acessibilidade       |
| Visita guiada                      | Tabela       | Opcional    | Fonte         | Operação             |
| Idiomas                            | Multiselect  | Recomendado | Fonte         | Filtro               |
| Política de fotografia             | Select       | Recomendado | Fonte         | Conteúdo             |
| Tempo por seção                    | Número/faixa | Opcional    | Curadoria     | Roteiro              |
| Dia gratuito                       | Regra        | Opcional    | Fonte         | Custo                |
| Guarda-volumes                     | Toggle       | Opcional    | Fonte         | Operação             |

## 9.10 Parque

| **Campo**            | **Controle** | **Obrig.**  | **Origem** | **Uso/Persistência** |
|----------------------|--------------|-------------|------------|----------------------|
| Tipo de parque       | Select       | Sim         | Fonte      | Taxonomia            |
| Área externa         | Toggle       | Sim         | Fonte      | Clima                |
| Trilhas/caminhada    | Multiselect  | Recomendado | Fonte      | Esforço              |
| Tempo mínimo/máximo  | Faixa        | Sim         | Curadoria  | Roteiro              |
| Banheiros/estrutura  | Checklist    | Recomendado | Fonte      | Família              |
| Alimentação no local | Select       | Opcional    | Fonte      | Planejamento         |
| Pet friendly         | Select       | Recomendado | Fonte      | Filtro               |
| Pontos de acesso     | Tabela/mapa  | Recomendado | Fonte      | Logística            |
| Melhor estação       | Multiselect  | Recomendado | Curadoria  | Engine               |
| Risco climático      | Select       | Sim         | Curadoria  | Qualidade            |

## 9.11 Tour

| **Campo**          | **Controle**   | **Obrig.**  | **Origem**      | **Uso/Persistência** |
|--------------------|----------------|-------------|-----------------|----------------------|
| Modalidade         | Select         | Sim         | Fonte           | Taxonomia            |
| Operador           | Relação        | Sim         | Fonte           | Parceiro             |
| Ponto de encontro  | Mapa/texto     | Sim         | Fonte           | Logística            |
| Duração            | Número         | Sim         | Fonte           | Roteiro              |
| Idiomas            | Multiselect    | Sim         | Fonte           | Filtro               |
| Tamanho do grupo   | Número/faixa   | Recomendado | Fonte           | Perfil               |
| Inclui transporte  | Toggle/detalhe | Recomendado | Fonte           | Logística            |
| Inclui ingressos   | Toggle/detalhe | Recomendado | Fonte           | Custo                |
| Política de atraso | Regra          | Sim         | Fonte oficial   | Viabilidade          |
| Cancelamento       | Regra          | Sim         | Fonte           | Compra               |
| Esforço físico     | Select         | Sim         | Fonte/curadoria | Engine               |
| Acessibilidade     | Checklist      | Recomendado | Fonte           | Filtro               |

## 9.12 Evento

| **Campo**                 | **Controle**  | **Obrig.**    | **Origem**     | **Uso/Persistência** |
|---------------------------|---------------|---------------|----------------|----------------------|
| Data/início/fim           | DateTime      | Sim           | Fonte          | Operação             |
| Recorrência               | Regra         | Se recorrente | Fonte          | Tabela               |
| Local                     | Relação/mapa  | Sim           | Fonte          | Logística            |
| Classificação etária      | Select        | Sim           | Fonte          | Publicação           |
| Setores/lotes             | Tabela        | Recomendado   | Fonte          | Venda                |
| Ingresso/booking URL      | URL/relação   | Sim se pago   | Fonte/parceiro | Monetização          |
| Capacidade                | Número        | Opcional      | Fonte          | Operação             |
| Artista/atração principal | Relação/texto | Sim           | Fonte          | Conteúdo             |
| Janela de entrada         | Faixa         | Recomendado   | Fonte          | Viabilidade          |
| Política de entrada       | Checklist     | Sim           | Fonte oficial  | Publicação           |
| Duração estimada          | Número        | Recomendado   | Fonte          | Roteiro              |
| Clima/indoor-outdoor      | Select        | Sim           | Fonte          | Engine               |

## 9.13 Aeroporto / estação / logística

| **Campo**                | **Controle**   | **Obrig.**    | **Origem**       | **Uso/Persistência** |
|--------------------------|----------------|---------------|------------------|----------------------|
| Tipo                     | Select         | Sim           | Fonte            | Taxonomia            |
| Código IATA/estação      | Texto validado | Conforme tipo | Fonte oficial    | Identidade           |
| Terminais                | Tabela         | Recomendado   | Fonte            | Operação             |
| Opções de transporte     | Tabela         | Sim           | Fonte            | transit_options      |
| Tempo médio por opção    | Número/faixa   | Sim           | Fonte/estimativa | Engine               |
| Custo por opção          | Moeda/faixa    | Sim           | Fonte + validade | Orçamento            |
| Horário de operação      | Tabela         | Recomendado   | Fonte            | Operação             |
| Bagagem/alfândega buffer | Número         | Recomendado   | Curadoria        | Roteiro              |
| Ponto de encontro        | Mapa/texto     | Recomendado   | Fonte            | Logística            |
| Acessibilidade           | Checklist      | Recomendado   | Fonte            | Filtro               |

# 10. Importação por URL e governança de origem

Importar é um assistente de revisão. A ferramenta extrai, sugere e
compara; o administrador confirma. Nenhum campo crítico é inventado.

## 10.1 Estados por campo

| **Estado**       | **Definição**                       | **Cor**     | **Regra**                         |
|------------------|-------------------------------------|-------------|-----------------------------------|
| Extraído         | Veio diretamente da fonte.          | Azul        | Mantém URL, data e evidência.     |
| Sugerido pela IA | Inferência baseada em texto/imagem. | Lilás       | Nunca é fato até confirmação.     |
| Confirmado       | Administrador aceitou ou editou.    | Menta       | Pode alimentar filtros e Engine.  |
| Conflito         | Fonte diverge de valor confirmado.  | Rosa        | Exige decisão humana.             |
| Não encontrado   | Fonte não trouxe dado.              | Cinza/âmbar | Permanece pendente; não inventar. |
| Desatualizado    | Validade vencida ou fonte mudou.    | Amarelo     | Solicita nova revisão.            |

## 10.2 Matriz por fonte

| **Fonte**           | **Dados esperados**                                               | **Confiabilidade** | **Cuidados**                          |
|---------------------|-------------------------------------------------------------------|--------------------|---------------------------------------|
| Site oficial        | Nome, endereço, políticas, horários, serviços, fotos, contato.    | Alta               | Não inferir personas/scores.          |
| Google Maps         | Endereço, coordenadas, horário, telefone, rating, reviews.        | Alta operacional   | Confirmar pin e horários especiais.   |
| Booking/Expedia     | Quartos, amenities, check-in/out, políticas, preço “a partir de”. | Média/alta         | Preço e disponibilidade têm validade. |
| TripAdvisor         | Rating, reviews, categoria, ranking.                              | Média/baixa        | Não copiar reviews para descrição.    |
| GetYourGuide/Viator | Duração, ingresso, ponto de encontro, idioma, cancelamento.       | Alta operacional   | Separar produto do operador.          |
| Outra fonte         | OpenGraph, schema.org e conteúdo disponível.                      | Variável           | Mostrar confiança e exigir revisão.   |

## 10.3 Fluxo oficial

17. Colar URL e identificar fonte.

18. Extrair dados brutos com evidência e timestamp.

19. Detectar possível duplicidade antes de criar novo item.

20. Mapear para campos comuns e campos do subtipo.

21. Separar Extraído, Sugerido, Confirmado, Conflito e Não encontrado.

22. Permitir aceitar campo a campo ou por grupo.

23. Salvar como rascunho quando faltarem obrigatórios.

24. Registrar source_url, source_type, extracted_at, confidence,
    confirmed_by e verified_at.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>PROIBIÇÕES<br />
</strong>Nunca inventar UUIDs, tags, personas, compatibilidade, política
infantil, acessibilidade, horário, preço, disponibilidade ou
cancelamento. short_description nunca recebe JSON.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 11. Taxonomias controladas

Campos que alimentam filtros, segmentação e Engine vêm de bibliotecas
centrais. O Admin não cria variantes livres durante o cadastro.

## 11.1 Bibliotecas

| **Biblioteca**         | **Contrato**                                                                                             |
|------------------------|----------------------------------------------------------------------------------------------------------|
| Tipo técnico           | hotel, hostel, apartment, restaurant, cafe, bar, attraction, museum, park, tour, event, airport, station |
| Categoria editorial    | accommodation, gastronomy, culture, nature, entertainment, nightlife, shopping, wellness, logistics      |
| Tags                   | Vocabulário pesquisável, agrupado e sem duplicidade.                                                     |
| Personas               | visual, curator, discoverer, optimizer, slow_traveler e futuras aprovadas.                               |
| Companhia              | solo, couple, family, friends, group, business.                                                          |
| Clima/ambiente/esforço | Enums ou taxonomias controladas.                                                                         |

- Interface exibe label em português e persiste slug técnico.

- Select pesquisável; multiselect resume quantidade e evita chuva de
  chips.

- Ação “Não encontrou? Gerenciar biblioteca” abre módulo próprio; não
  cria silenciosamente.

- Valores legados ficam visíveis durante edição até migração explícita.

# 12. IA Concierge, Perfil do Viajante e Engine

A IA interpreta fatos e produz recomendações explicáveis. Sliders
genéricos de 50% não representam inteligência e devem desaparecer.

## 12.1 Contrato de resultado

| **Campo**       | **Formato**                   | **Regra**                                          |
|-----------------|-------------------------------|----------------------------------------------------|
| score           | 0–100 ou não calculado        | Nunca usar 50 como fallback.                       |
| confidence      | 0–100                         | Baseada na cobertura e confiabilidade dos fatos.   |
| reasons         | lista de razões               | Explica os principais fatores positivos/negativos. |
| missingData     | lista de lacunas              | Mostra o que impede precisão.                      |
| source          | calculated \| manual_override | Distingue cálculo e intervenção.                   |
| calculatedScore | valor original                | Preservado quando há override.                     |
| overrideReason  | texto obrigatório             | Auditoria da alteração manual.                     |

## 12.2 Exemplos de raciocínio

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>HOSTEL SOCIAL<br />
</strong>Dormitório compartilhado + cama individual + área social +
preço acessível elevam Solo e Amigos; privacidade baixa e política
infantil ausente reduzem Família e Casal.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>RESTAURANTE ROMÂNTICO<br />
</strong>Reserva recomendada + ambiente intimista + ticket premium podem
elevar Casal/Curador e reduzir Família/Econômico, com razões
visíveis.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 12.3 Interface

- Resumo sempre visível: match principal, companhia ideal, faixa, clima,
  confiança e atenção.

- Painel detalhado mostra razões, dados ausentes e comparação entre
  cálculo e override.

- Override exige justificativa e botão “Restaurar cálculo automático”.

- Perfil do Viajante usa tags/personas reais e persistentes; nunca três
  tags aleatórias.

- Importação por URL pode sugerir, mas não confirmar inteligência sem
  revisão.

# 13. Persistência, schema, migrations e segurança

## 13.1 Estado de schema a confirmar

- Banco remoto já retornou type=hotel em registros reais, mas schema.sql
  e migrations locais não documentam a criação da coluna: tratar como
  drift de schema.

- supabase.types.ts contém campos possivelmente divergentes do banco.
  Não é fonte de verdade até regeneração.

- tags/personas devem usar relações N:N; arrays declarados em
  experiences precisam de auditoria.

- check-in/check-out de hospedagem não são operating_hours e precisam de
  modelagem própria se ausentes.

- intelligence_metadata aceita somente objeto JSONB e armazena
  resultados da Engine/auditoria, não fatos operacionais arbitrários.

## 13.2 Sequência segura para banco

25. Auditar banco remoto e exportar schema real.

26. Comparar remoto × schema.sql × migrations × supabase.types.ts ×
    código consumidor.

27. Decidir modelagem canônica e escrever migrations separadas.

28. Criar backup e plano de rollback.

29. Aplicar uma migration por vez em ambiente controlado.

30. Validar dados, índices, FKs, constraints e RLS após cada aplicação.

31. Regenerar tipos a partir do banco real.

32. Atualizar Repository e somente depois ativar UI dependente.

## 13.3 Segurança

| **Controle**              | **Status**                    | **Regra**                                               |
|---------------------------|-------------------------------|---------------------------------------------------------|
| Migration 000006          | Aplicada                      | admin_users e public.is_admin() disponíveis.            |
| Login                     | Validado                      | Sessão persiste e logout funciona.                      |
| Autorização frontend      | Pendente                      | Chamar public.is_admin(); bloquear não-admin e inativo. |
| RLS de tabelas de negócio | Pendente de auditoria         | Admin write; Consumer read apenas publicado/ativo.      |
| service_role              | Proibido no frontend          | Somente backend seguro quando necessário.               |
| Exclusão                  | Arquivar/desativar por padrão | Hard delete somente com caso explícito.                 |

# 14. Plano de implementação por fases

A ordem abaixo substitui qualquer plano anterior. Nenhuma fase começa
sem autorização explícita e sem confirmar que a anterior foi versionada
e validada.

| **Fase** | **Nome**                             | **Objetivo**                                                                                        |
|----------|--------------------------------------|-----------------------------------------------------------------------------------------------------|
| 0        | Congelar V3 e referências            | Salvar este documento e imagens oficiais no repositório; nenhuma implementação.                     |
| 1        | Auditoria do schema remoto           | Provar drift de type/tags/personas; inventário de colunas, FKs, policies e consumers.               |
| 2        | Autorização e RLS                    | Conectar public.is_admin(), auditar policies e validar conta não-admin.                             |
| 3        | Design tokens escopados ao Admin     | Criar tokens sem afetar Consumer; testar contraste e componentes.                                   |
| 4        | Navegação e cabeçalho contextual     | Sanfona, busca, breadcrumb e header reutilizável.                                                   |
| 5        | Catálogo Mestre                      | Tabela primeiro; depois Lista; depois Cards + mapa. Preservar filtros validados.                    |
| 6        | Editor Core                          | Duas colunas, preview, estado comum e persistência básica sem novos campos.                         |
| 7        | Taxonomias canônicas                 | Tipo, categoria, tags, personas, companhia e enums controlados.                                     |
| 8        | Migrations de fundação               | Aplicar pendentes individualmente; adicionar campos comuns/proveniência aprovados; regenerar types. |
| 9        | Módulo Hospedagens                   | Hotel, hostel e apartamento com contratos separados.                                                |
| 10       | Módulo Gastronomia                   | Restaurante, café e bar com contratos separados.                                                    |
| 11       | Atrações, Tours, Eventos e Logística | Campos condicionais, horários/exceções e transporte.                                                |
| 12       | Importação orientada a confiança     | Extraído/sugerido/confirmado, duplicidade, conflitos e rastreabilidade.                             |
| 13       | Persistência da IA                   | Salvar/carregar Perfil, scores, razões, lacunas e overrides.                                        |
| 14       | Engine e Qualidade                   | Regras determinísticas, confiança, central de correção e publicação.                                |
| 15       | Dashboard, Analytics e Receita       | Métricas reais, filas acionáveis, funis e monetização.                                              |
| 16       | Validação final e rollout            | E2E, segurança, acessibilidade, performance, rollback e documentação viva.                          |

## 14.1 Contrato de cada fase

- Objetivo fechado e arquivos autorizados.

- Migrations nomeadas e não aplicadas sem autorização.

- Funcionalidades que não podem regredir.

- Testes automáticos específicos.

- Teste manual com roteiro objetivo.

- Critério de aprovação e rollback.

- Um commit e push apenas após aprovação.

- Atualização de PROJECT_CONTEXT.md, DECISIONS.md e ROADMAP.md ao
  concluir.

# 15. Critérios de aceite e regras contra regressão

## 15.1 Proibições para o Antigravity

- Não remover Importar por URL, IA Concierge, tags, personas ou campos
  para “estabilizar” a tela.

- Não usar short_description como JSON.

- Não enviar undefined, “undefined”, string vazia ou ID inventado a
  colunas UUID.

- Não tratar rota inválida como CREATE.

- Não misturar category editorial e type técnico.

- Não criar score neutro 50% por falta de dados.

- Não criar campos apenas no frontend sem schema e migration.

- Não alterar componentes compartilhados com Consumer sem análise de
  impacto.

- Não aplicar cinco migrations em um comando.

- Não declarar segurança concluída sem teste com usuário não-admin.

## 15.2 Checklist por entrega

| **Dimensão**  | **Critério**                                                                |
|---------------|-----------------------------------------------------------------------------|
| Código        | ESLint específico; build; diff --check; busca por logs/hardcodes.           |
| Dados         | Payload real; schema compatível; undefined removido; constraints validadas. |
| UX            | Normal, vazio, loading, erro, bloqueio e sucesso.                           |
| Persistência  | Salvar, recarregar, editar e preservar valores.                             |
| Segurança     | Rota, autorização, RLS e ausência de segredo no frontend.                   |
| Regressão     | CREATE/EDIT, filtros, importação, IA e Consumer preservados.                |
| Versionamento | Arquivos autorizados, commit específico, push e status limpo.               |

**FONTE DE VERDADE — Em conflito entre imagem e texto, este documento
prevalece. Em conflito entre tipos gerados e banco remoto comprovado, o
banco remoto e migrations versionadas prevalecem após auditoria.**

# 16. Referências visuais oficiais

As imagens abaixo são referências de hierarquia, linguagem e
componentes. Elas não autorizam copiar métricas fictícias nem substituir
as regras deste documento.

<img src="/mnt/data/v3_md/media/image1.png"
style="width:6.65in;height:3.74261in" />

*Dashboard: distribuição entre produto, usuários, viagens, assinaturas,
receita, operação, qualidade e IA. O cabeçalho contextual sem foto e em
cor é obrigatório.*

<img src="/mnt/data/v3_md/media/image2.png"
style="width:6.65in;height:6.17705in" />

*Catálogo Mestre: header, filtros, tabela, seleção múltipla e mapa
sincronizado. Ajuste obrigatório: no modo Tabela, mapa recolhido por
padrão.*

<img src="/mnt/data/v3_md/media/image3.png"
style="width:6.65in;height:4.15817in" />

*Editor: formulário à esquerda e prévias fixas à direita; referência de
estrutura, não de campos definitivos.*

<img src="/mnt/data/v3_md/media/image4.png"
style="width:6.65in;height:4.15817in" />

*Inteligência da Experiência: cards de leitura da Engine. Sliders de 50%
são problema conhecido e não representam contrato final.*

## 16.1 Encerramento

**Este V3 encerra a fase de definição dispersa. O próximo trabalho deve
começar pela Fase 1 — auditoria do schema remoto — e não por uma nova
rodada de mockups ou por alteração global de cores.**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>PRÓXIMA AÇÃO ÚNICA<br />
</strong>Anexar este documento e as quatro imagens de referência ao
repositório. Depois instruir o Antigravity a executar apenas a auditoria
do schema remoto, sem alterar código ou banco.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>
