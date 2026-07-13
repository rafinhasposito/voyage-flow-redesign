# CONTRATO TÉCNICO DOS DADOS DO ADMIN (FASE 1B - VERSÃO 1.1)

Este documento estabelece o contrato técnico definitivo dos dados necessários para o Admin do MVP. Nenhuma implementação de interface será feita nesta etapa; o objetivo é congelar a modelagem de dados, arquitetura de tabelas e as diretrizes de compatibilidade.

---

## 1. INVENTÁRIO DO ESTADO ATUAL

### Tabelas Atuais Relevantes
- `destinations`
- `experiences`
- `tags`
- `personas`
- `experience_tags`
- `experience_personas`
- `engine_configs`

### Colunas Atuais de Destinations
`id` (uuid), `name` (text), `country` (text), `timezone` (text), `currency` (text), `cover_image_url` (text), `is_active` (bool), `created_at` (timestamptz), `description_short` (text), `language` (text), `location_lat` (numeric), `location_lng` (numeric), `slug` (text).

### Colunas Atuais de Experiences
`id` (uuid), `destination_id` (uuid), `partner_id` (uuid), `title` (text), `description` (text), `short_description` (text), `category` (text), `base_cost` (numeric), `duration_minutes` (int), `location_lat` (numeric), `location_lng` (numeric), `address` (text), `neighborhood` (text), `booking_url` (text), `energy_level` (text), `indoor_outdoor` (text), `weather_suitability` (text), `media_urls` (text[]), `status` (experience_status), `created_at` (timestamptz), `updated_at` (timestamptz), `type` (text), `check_in_time` (text), `check_out_time` (text), `climate` (text[]), `ideal_companion` (text[]), `exclusivity_level` (text), `is_must_see` (bool), `rating` (numeric), `reservation_required` (bool), `reviews_count` (int), `tags` (text[]), `personas` (text[]), `video_embed_url` (text), `dress_code` (text), `intelligence_metadata` (JSONB).

### Constraints e Estruturas Existentes
- **Foreign Keys**: `experiences.destination_id` -> `destinations.id`, tabelas de junção `experience_tags` e `experience_personas` referenciam tabelas pai.
- **Enums**: `experience_status` ('draft', 'published', 'archived').
- **Check Constraints**: `chk_experiences_intelligence_metadata_is_object`.
- **Triggers**: `update_modified_column()` em `updated_at`.
- **Campos Usados pelo ExperienceEditor**: Praticamente todos os campos estruturados de `experiences` são carregados, manipulados na UI e salvos via `ExperienceRepository.ts`. O JSONB `intelligence_metadata` é injetado localmente no Editor, mas salvo isoladamente para preservar a flexibilidade.
- **Campos Usados pelo Repository**: Carrega `*` e mapeia para a `TravelExperience` (memória).
- **Campos Usados pela Engine**: Tags, Personas, Companionship Compatibility, Duration, Cost, Categoria, Type, Status.

### Conflitos e Lacunas
- `duration_minutes` atual é restritivo para logísticas onde a duração é incerta.
- Dados qualitativos vitais (acessibilidade, fila, períodos de refeição, bagagem) não estão estruturados.
- Transporte não suportado pelo schema atual.
- Horários baseados na data não mapeados, inviabilizando encaixe na Engine real.

---

## 2. PRINCÍPIOS DO CONTRATO

Regras inegociáveis para a evolução do banco de dados:
1. A tabela `experiences` continua sendo o **núcleo do catálogo**.
2. **Restaurantes, hotéis, atrações e aeroportos não terão tabelas próprias no MVP** (serão gerenciados por campos ou metadados de `experiences`).
3. **Horários serão relacionais**.
4. **Transporte terá entidade própria** (`transit_options`).
5. **Timezone e moeda padrão pertencem ao destino** (`destinations`), e a experiência as herda automaticamente.
6. A **reserva específica pode sobrescrever a regra padrão** do Admin (contrato de precedência).
7. **Nenhum dado existente será apagado** ou reutilizado com significado diferente.
8. **Novas colunas serão `NULLABLE`** para não quebrar cadastros e registros existentes durante a transição.
9. **Migrations serão estritamente incrementais** (ADD COLUMN IF NOT EXISTS).
10. `short_description` continua sendo puramente **texto editorial**.
11. `intelligence_metadata` continuará reservado e exclusivo para a **inteligência flexível e paramétrica da Engine** (matemática abstrata).
12. **Colunas estruturadas sempre terão prioridade sobre JSONB.**

---

## 3. CONTRATO DE DESTINATIONS

Os campos atuais de `destinations` (`timezone`, `currency`, `language`, etc) já cobrem grande parte do domínio. Adicionaremos apenas a coluna internacional estritamente necessária.

| Campo Proposto | Tipo SQL | Nullable? | Origem | Uso Futuro |
|---|---|---|---|---|
| `country_code` | text | Sim | Admin | Código ISO de 2 letras. |

*Ações recomendadas*:
A tabela atual já possui `currency` (como default) e `language` (como locale). Pode-se adicionar apenas `country_code` com um check de 2 caracteres maiúsculos quando preenchido. Nenhuma remoção de campos atuais.

---

## 4. CONTRATO DE EXPERIENCES

Avaliação e direcionamento arquitetural dos metadados operacionais e logísticos.

### IDENTIDADE E CLASSIFICAÇÃO
- `category`, `type`, `title`, `description`, `short_description`: **Reutilizados**. Obrigatórios.

### LOCALIZAÇÃO
- `location_lat`, `location_lng`, `neighborhood`, `address`: **Reutilizados**. Obrigatórios.

### DURAÇÃO E OPERAÇÃO
- `ideal_duration_minutes` (Nova coluna Int, nullable): Tempo que a Engine deve alocar. Substitui conceitualmente o `duration_minutes` legado (que se mantém por retrocompatibilidade).
- `min_duration_minutes` (Nova coluna Int, nullable): Importante. Mínimo técnico necessário para viabilidade.
- `max_duration_minutes` (Nova coluna Int, nullable): Máximo técnico suportado.
- `buffer_before_minutes` (Nova coluna Int, nullable): Importante (aeroportos, atrações rígidas).
- `buffer_after_minutes` (Nova coluna Int, nullable): Importante.
- `typical_queue_minutes` (Nova coluna Int, nullable): Calculado por IA ou preenchido via Quality Admin. Impacta rota. Pode sofrer override (Fast Pass).

### ALIMENTAÇÃO
- `meal_periods` (Nova coluna Text[], nullable): `['breakfast', 'brunch', 'lunch', 'afternoon_tea', 'snack', 'dinner', 'late_night']`. Exclusivo para restaurantes. Sem override. (Conjunto permitido controlado por validação no banco).

### CLIMA E ESFORÇO
- `indoor_outdoor` (Reutilizado): Mantém coluna atual.
- `weather_suitability` (Reutilizado): Mantém coluna atual. Substitui o conceito de rain_suitability.
- `energy_level` (Reutilizado): Mantém coluna atual. Substitui o conceito de physical_effort.

### RESERVA E COMERCIAL
- `base_cost` (Reutilizado): Custo padrão referencial.
- `booking_deadline_hours` (Nova coluna Int, nullable): Importante. Aceita 0 para "na porta". CHECK >= 0. Override permitido por reserva específica da viagem.
- `booking_time_mode` (Nova coluna Text, nullable): Importante para o Editor. Substitui `fixed_or_flexible`. Valores conceituais:
  - `open`: Entrada livre sem horário.
  - `time_window`: Reserva para um período do dia.
  - `fixed_time`: Exige horário exato.
  - `scheduled_session`: Sessão com início fixo.
  - `walk_in`: Fila por ordem de chegada.
- `booking_url` (Reutilizado).
- `reservation_required` (Reutilizado).

### QUALIDADE DO DADO
- `source_url` (Nova coluna Text, nullable): URL de onde a IA ou o editor tirou a info editorial geral.
- `verified_at` (Nova coluna Timestamptz, nullable): Última auditoria geral.

### INTELIGÊNCIA
- `intelligence_metadata` (Reutilizado JSONB): Exclusivo para pesos de perfis e afinidades.
- **Sazonalidade**: Não pertence ao `intelligence_metadata`. Fatos operacionais (ex: se abre só no verão) serão representados por `valid_from` e `valid_to` em `operating_hours`, por `operating_hour_exceptions` ou evoluções estruturadas caso os casos exijam, mas nunca por um JSON abstrato de afinidade.

---

## 5. CONTRATO DE OPERATING_HOURS

Tabela relacional universal de horários.

**Tabela: `operating_hours`**
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `experience_id` UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE
- `day_of_week` INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6)
- `period_type` TEXT NOT NULL CHECK (period_type IN ('general', 'kitchen', 'service'))
- `opens_at` TIME (nullable)
- `closes_at` TIME (nullable)
- `last_entry_at` TIME (nullable)
- `is_closed` BOOLEAN DEFAULT false
- `is_24_hours` BOOLEAN DEFAULT false
- `spans_next_day` BOOLEAN DEFAULT false
- `sort_order` INTEGER DEFAULT 0
- `valid_from` DATE (nullable - Sazonalidade)
- `valid_to` DATE (nullable - Sazonalidade)
- `source_url` TEXT (nullable)
- `verified_at` TIMESTAMPTZ (nullable)
- `created_at`, `updated_at` TIMESTAMPTZ

**Regras / Representação:**
- **Vários turnos:** Registros independentes com mesmo `day_of_week` e `period_type`, ordenados por `sort_order`.
- **Passa de meia-noite:** O registro é vinculado ao dia de operação e `spans_next_day = true`.
- **Fechamento total:** `is_closed = true`. Não possui `opens_at`/`closes_at`.
- **24 horas:** `is_24_hours = true`. Não exige `opens_at`/`closes_at`.
- **Última entrada:** É associada a um intervalo regular via `last_entry_at`.
- **Sazonalidade:** Usa `valid_from` e `valid_to`.

---

## 6. CONTRATO DE OPERATING_HOUR_EXCEPTIONS

Substitui o simples `temporary_closure`, modelando qualquer anomalia de calendário. Suporta múltiplos intervalos se fizerem parte da mesma exceção no dia.

**Tabela: `operating_hour_exceptions`**
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `experience_id` UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE
- `start_date` DATE NOT NULL
- `end_date` DATE NOT NULL
- `status` TEXT NOT NULL CHECK (status IN ('closed', 'modified_hours', 'special_opening'))
- `period_type` TEXT DEFAULT 'general' CHECK (period_type IN ('general', 'kitchen', 'service'))
- `opens_at` TIME (nullable)
- `closes_at` TIME (nullable)
- `last_entry_at` TIME (nullable)
- `spans_next_day` BOOLEAN DEFAULT false
- `sort_order` INTEGER DEFAULT 0
- `reason` TEXT (nullable)
- `source_url` TEXT (nullable)
- `verified_at` TIMESTAMPTZ (nullable)
- `created_at`, `updated_at` TIMESTAMPTZ

**Regras (Conflitos):**
- **Regra Determinística:** Exceções incompatíveis ou sobrepostas **não podem ser publicadas**. O Admin é responsável por validar e proibir conflitos.
- A Engine não faz escolhas arbitrárias; ela deve receber um calendário consistente.
- Múltiplos intervalos são permitidos quando têm ordenação (`sort_order`) válida no mesmo dia.

---

## 7. CONTRATO DE TRANSIT_OPTIONS

Opções editoriais/estáticas de locomoção. O trânsito real será complementado pela Engine.

**Tabela: `transit_options`**
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `destination_id` UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE
- `origin_experience_id` UUID REFERENCES experiences(id) ON DELETE SET NULL
- `destination_experience_id` UUID REFERENCES experiences(id) ON DELETE SET NULL
- `origin_zone` TEXT (nullable)
- `destination_zone` TEXT (nullable)
- `title` TEXT NOT NULL
- `modality` TEXT NOT NULL CHECK (modality IN ('walking', 'subway', 'train', 'bus', 'ferry', 'taxi', 'rideshare', 'private_transfer', 'shuttle', 'rental_car', 'mixed'))
- `description` TEXT
- `duration_min_minutes` INTEGER
- `duration_avg_minutes` INTEGER
- `duration_max_minutes` INTEGER
- `price_min` NUMERIC
- `price_max` NUMERIC
- `currency` TEXT (Override)
- `frequency_minutes` INTEGER (nullable)
- `operation_notes` TEXT
- `transfers_required` INTEGER DEFAULT 0
- `luggage_suitability` TEXT CHECK (luggage_suitability IN ('poor', 'limited', 'suitable', 'excellent'))
- `accessibility` TEXT[] (ex: 'wheelchair', 'stroller', 'step_free', 'elevator', 'assistance_available')
- `booking_required` BOOLEAN DEFAULT false
- `booking_url` TEXT
- `instructions` TEXT
- `source_url` TEXT
- `verified_at` TIMESTAMPTZ
- `status` TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
- `created_at`, `updated_at` TIMESTAMPTZ

**Constraints de Trânsito:**
- Origem e destino não podem estar vazios ambos.

---

## 8. CONSTRAINTS OBRIGATÓRIAS A DOCUMENTAR NO BANCO

**Experiences:**
- Duração/Tempo: `min_duration_minutes >= 0`, `ideal_duration_minutes >= 0`, `max_duration_minutes >= 0`, `buffers >= 0`, `typical_queue_minutes >= 0`, `booking_deadline_hours >= 0`.
- Relação: `min_duration_minutes <= ideal_duration_minutes <= max_duration_minutes` (quando presentes).

**Operating Hours:**
- `day_of_week` entre 0 e 6.
- `valid_from <= valid_to`.
- `is_closed` e `is_24_hours` não podem ser `true` simultaneamente.
- Se `is_closed` = true: `opens_at` e `closes_at` devem ser nulos.
- Se `is_24_hours` = true: não exige preenchimento de `opens_at`/`closes_at`.
- Se normal: `opens_at` e `closes_at` não nulos.
- `sort_order >= 0`.

**Exceptions:**
- `start_date <= end_date`.
- Validação coerente por status (ex: `closed` não possui intervalo aberto; `modified_hours` e `special_opening` exigem intervalos informados ou 24h).

**Transit Options:**
- Durações >= 0 e coerência: `duration_min <= duration_avg <= duration_max` (quando presentes).
- Preços >= 0 e `price_min <= price_max`.
- Frequência e transfers: `frequency_minutes > 0`, `transfers_required >= 0`.
- OBRIGATÓRIO: Ou existe ID/zona de origem E ID/zona de destino; a Origem não pode ser igual ao destino (quando avaliado ID ou zona idêntica).

---

## 9. CONTRATOS TYPESCRIPT FUTUROS (Conceitual)

Sem alterar código existente, as interfaces para a Fase 2 refletem campos `nullable` e tipos controlados.

```typescript
export type BookingTimeMode = 'open' | 'time_window' | 'fixed_time' | 'scheduled_session' | 'walk_in';
export type MealPeriod = 'breakfast' | 'brunch' | 'lunch' | 'afternoon_tea' | 'snack' | 'dinner' | 'late_night';
export type OperatingPeriodType = 'general' | 'kitchen' | 'service';

export interface OperatingHour {
  id: string;
  experience_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  period_type: OperatingPeriodType;
  opens_at: string | null;
  closes_at: string | null;
  last_entry_at: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
  spans_next_day: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_to: string | null;
}

export interface OperatingHourException {
  id: string;
  experience_id: string;
  start_date: string;
  end_date: string;
  status: 'closed' | 'modified_hours' | 'special_opening';
  period_type: OperatingPeriodType;
  opens_at: string | null;
  closes_at: string | null;
  last_entry_at: string | null;
  spans_next_day: boolean;
  sort_order: number;
}

export interface OperationalExperienceData extends TravelExperience {
  idealDurationMinutes?: number | null;
  minDurationMinutes?: number | null;
  maxDurationMinutes?: number | null;
  bufferBeforeMinutes?: number | null;
  bufferAfterMinutes?: number | null;
  typicalQueueMinutes?: number | null;
  bookingTimeMode?: BookingTimeMode | null;
  mealPeriods?: MealPeriod[] | null;
  operatingHours?: OperatingHour[];
  exceptions?: OperatingHourException[];
}
```

---

## 10. ESTRATÉGIA DE REPOSITORY CONTRA N+1

Para garantir performance e isolamento da complexidade no MVP:
- `ExperienceRepository` carregará **somente** a experiência base (dados da tabela `experiences`), protegendo o catálogo primário.
- Será criado um `OperatingHoursRepository` separado.
- **Admin/Editor:** Para carregar a UI do editor individual, o `OperatingHoursRepository` buscará os horários de uma experiência específica.
- **Engine/Roteiro:** Para gerar o itinerário, a Engine entregará a lista de IDs (`experience_ids`) candidatos e o `OperatingHoursRepository` fará **uma consulta em lote**.
- **Proibição Absoluta:** É estritamente proibido buscar horários individualmente dentro de laços de repetição.
- Haverá um `TransitOptionRepository` totalmente isolado.
- Ausência de dados operacionais (nulos ou sem horários associados) **não quebra** o catálogo; a Engine apenas tratará a experiência com mais restrições ou gerará warnings.

---

## 11. PROVENIÊNCIA DOS DADOS E VERIFICAÇÃO

- Um `source_url` genérico na tabela `experiences` representa a origem geral da curadoria editorial.
- Horários de funcionamento, regras excepcionais e transportes **devem possuir `source_url` e `verified_at` próprios** em suas tabelas, pois o ciclo de atualização dessas informações logísticas é completamente diferente da identidade da atração.

---

## 12. ESTRATÉGIA DE MIGRATION E ROLLBACK

As migrations devem seguir uma política protetora e incremental, não destrutiva.
- **Antes da aplicação (Dev/Staging local):** Uma migration recém-escrita e não submetida à PR pode ser revisada, editada ou descartada.
- **Depois da aplicação em ambientes compartilhados/Produção:** O rollback oficial deve ser feito com uma **migration compensatória**.
- O uso de `git revert` no repositório reverte o código da aplicação e o arquivo SQL da migration, mas não revoga as alterações já executadas pelo banco remotamente sem a intervenção devida.
- **PROIBIDO:** Nunca se executa `DROP` numa tabela ou numa coluna que contenha dados no banco, sem antes obter aprovação explícita, garantir backup (snapshots) e um plano de recuperação validado.

A ordem de implementação das migrations (Blocos) é:
1. **MIGRATION A**: Ajustes de `destinations` (`country_code`).
2. **MIGRATION B**: Expansão de colunas estruturadas nullables em `experiences` (`ideal_duration_minutes`, `booking_time_mode`, `meal_periods`, etc.).
3. **MIGRATION C**: Tabela `operating_hours`.
4. **MIGRATION D**: Tabela `operating_hour_exceptions`.
5. **MIGRATION E**: Tabela `transit_options`.

---

## 13. MATRIZ DE DECISÃO FINAL

| Dado / Campo | Localização Final | Tipo SQL | Consumo Engine |
|---|---|---|---|
| `ideal_duration_minutes` | `experiences` | Int | Alocação de slot ideal |
| `min_duration_minutes` | `experiences` | Int | Condição de viabilidade |
| `max_duration_minutes` | `experiences` | Int | Condição elástica máxima |
| `buffer_before_minutes` | `experiences` | Int | Tempo logístico de espera/chegada |
| `booking_time_mode` | `experiences` | Text | Regra de agendamento de ticket |
| `meal_periods` | `experiences` | Text[] | Categorização estrita para restaurante |
| Horários da semana | `operating_hours` | Tabela | Viabilidade de encaixe no roteiro |
| Feriados / Fechamentos | `operating_hour_exceptions`| Tabela | Override temporal de viabilidade |
| Meio de Transporte | `transit_options` | Tabela | Regra de base modal |
| `verified_at` e `source_url`| `experiences` e Tabelas satélite | Timestamp / Text| Confiança da AI e periodicidade |

---

## 14. DECISÕES PENDENTES

Os pontos técnicos essenciais para o MVP foram resolvidos nesta documentação. Não há indefinições de arquitetura sobre sazonalidade, conflito de horários (a serem vetados no Admin), formatos de transporte ou mitigação N+1.

Ficam como decisões estritamente pendentes:
- O desenho final da interface visual (UI) para input dos múltiplos cenários de horários em `ExperienceEditor.tsx`.
- Regras complementares ou warnings de interface caso o curador deixe algum dado crítico (`ideal_duration_minutes`) nulo.

---
*Fim do Contrato Técnico (Fase 1B - Versão 1.1).*
