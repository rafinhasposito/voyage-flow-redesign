# Plano de Implementação: Logística e Semântica (Engine V2)

O objetivo desta fase é transformar o algoritmo de "distribuidor de blocos cegos" para um **Planejador Logístico e Semântico** real. O algoritmo passará a respeitar a física da viagem (deslocamento, malas, check-in) e a semântica da vida real. Estimativas serão tratadas como estimativas e não como fatos consumados.

## 1. Cadeia Logística Flexível (Chegada e Partida)

As constantes de tempo não serão verdades absolutas. Teremos "Variáveis Logísticas" configuráveis e com graus de confiança.

### 1.1 Dia da Chegada (Arrival)
Não permitiremos nenhuma atividade livre antes da consolidação no destino.

1. **Aterrissagem:** (`flight.arrivalInstant`)
2. **Procedimentos Aeroportuários (Imigração/Malas):** Dinâmico (ex: 1h doméstico, 1h30 intl, ou estimado "Source: fallback").
3. **Deslocamento até Basecamp:** Dinâmico.
4. **Guarda de Bagagem (Drop-off):** 
   - Se a acomodação confirma guarda: "Guarda confirmada".
   - Caso contrário: "Locker alternativo sugerido" ou "Condição do hotel desconhecida".
5. **Check-in:** 
   - Entendido como uma *janela* (ex: "Quarto disponível a partir das 15h"). 
   - A atividade de check-in não obriga o usuário a estar no hotel às 15h em ponto, mas sim a partir de 15h. O algoritmo pode agendar atividades leves antes, desde que a bagagem esteja tratada.
6. **Atividades Pré-Check-in:** Apenas sugestões leves e próximas à hospedagem (café, caminhada) ou almoço.

### 1.2 Dia da Partida (Departure)
A retroengenharia do voo.

1. **Check-out:** Janela até às 11:00. O check-out obrigatório não exige ida imediata ao aeroporto.
2. **Guarda de Bagagem (Drop-off):** Similar à chegada, onde deixar as malas até a hora do voo.
3. **Tempo Livre (Atividade Compatível):** Atividades seguras próximas ao centro logístico (sem longos deslocamentos que gerem risco ao voo).
4. **Recuperação das Malas & Deslocamento:** Retorno à base.
5. **Antecedência no Aeroporto:** Dinâmico (ex: 2h doméstico, 3h intl).
6. **Voo de Partida:** (`flight.departureInstant`).

---

## 2. Matriz Semântica Hierárquica (Inteligência Contextual)

O escalonador não encaixará os cards no próximo buraco cego. Haverá uma validação semântica da hora do dia.

**Hierarquia de Decisão de Horários:**
1. `operating_hours` / `operating_hour_exceptions` reais.
2. Propriedades estruturadas: `meal_periods`, `best_time`, `experienceRole`.
3. Categoria (`category`), Tipo (`type`) e `tags` estruturadas do banco.
4. Keywords textuais apenas como fallback extremo, rotuladas claramente como "Baixa confiança".

Exemplo Semântico: 
- Jantar/Dinner/Nightlife: Somente a partir do fim da tarde/noite.
- Sunrise/Morning: Apenas manhãs (06:00 - 10:00).
- Brunch: Fins de semana/manhã avançada (depende do dia da semana).

---

## 3. Input Health & Validação Estrita (Correções)

- `TRAVELER_NOT_IN_DESTINATION` (**CRITICAL**): Se qualquer dia anterior ao voo de chegada ou posterior ao voo de partida possuir atividades.
- `OUT_OF_BOUNDS_FLIGHT` (**CRITICAL**): Reserva de voo corrompida (datas erradas) ou tentativa explícita do engine de burlar as âncoras.
- `SEMANTIC_MISMATCH` (**CRITICAL**): Reserva fixa em horário incompatível (ex: jantar fixado às 9h da manhã).
- `FLIGHT_MISSING` (**WARNING**): A viagem não possui âncora de voo. Reduz a confiança, mas não invalida o draft.

---

## 4. Integração do Basecamp (Hotel)

O Basecamp será a espinha dorsal logística do roteiro.
- **Logística Operacional:** Origem e retorno dos dias, local de bagagem, local de check-in.
- **Sem GPS:** O warning indicará a falha técnica, mas o hotel existirá operacionalmente através do contexto semântico (nome, bairro) para as sugestões ao redor. Nunca excluir o hotel da cadeia por falta de GPS.
