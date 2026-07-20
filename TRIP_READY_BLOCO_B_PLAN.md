# Plano de Ação - Bloco B: Onboarding Concierge Wallet-First & Carteira da Viagem

## 1. Onboarding Revisado e Wireflow (5 Etapas)
O fluxo muda de um quiz abstrato para um *setup prático de viagem*, onde as certezas engessam o roteiro.

1. **Sua Viagem (Etapa 1)**: Captura de Meta (Destino, Chegada, Partida, Ponto de Chegada, Moeda, Viajantes).
2. **O que você já reservou? (Etapa 2)**: Grade de botões para (Voo, Hotel, Trem, Show...). Para cada um, escolhe "Já tenho", "Quero adicionar depois", "Não preciso". A seleção "Já tenho" abre modais de Captura Rápida.
3. **Seus Documentos e Passes (Etapa 3 - Carteira da Viagem)**: Visão de Upload *Drag & Drop*. Aqui entra importação de PDF/E-mail/Screenshot. Os uploads geram *Passes Visuais* provisórios (ex: Flight Pass).
4. **Seu Estilo + Tinder (Etapa 4)**: Captura de ritmo, orçamento, e um card-stack estilo Tinder com 8-12 experiências reais ("Já comprei" transforma em compromisso fixo).
5. **DNA e Revisão (Etapa 5)**: Resumo visual dos passes + lacunas abertas. Botão final: "Criar meu roteiro".

## 2. Modelos de Pass & Módulos
- **Card de Voo (Flight Pass)**: Inspirado em Boarding Pass (Cia, Origem->Destino, Localizador, Status de Embarque).
- **Card de Hotel (Hotel Pass)**: Capa, nome, check-in, check-out, status, botão MapLibre.
- **Carteira da Viagem**: A view agrupadora de todos os *Passes*, com indicador *offline*.

## 3. Schema Proposto (Banco de Dados B2C)
As tabelas abaixo formarão a migration `20260721000003_trip_wallet_foundation.sql` (Pendente de Teste Local via Docker).

**`public.trip_reservations`**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES public.profiles(id),
type TEXT NOT NULL, -- 'flight', 'hotel', 'ticket'
title TEXT,
provider TEXT,
purchase_status TEXT, -- 'booked', 'paid', 'wanted', 'undecided'
confirmation_code TEXT,
start_at TIMESTAMPTZ,
end_at TIMESTAMPTZ,
location_name TEXT,
address TEXT,
latitude DOUBLE PRECISION,
longitude DOUBLE PRECISION,
is_fixed BOOLEAN DEFAULT true,
price NUMERIC,
currency TEXT,
structured_data JSONB,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**`public.trip_documents`**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
reservation_id UUID REFERENCES public.trip_reservations(id) ON DELETE SET NULL,
user_id UUID NOT NULL REFERENCES public.profiles(id),
document_type TEXT,
file_name TEXT,
storage_path TEXT NOT NULL,
mime_type TEXT,
file_size INTEGER,
parsed_data JSONB,
parse_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
offline_enabled BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW()
```

## 4. Storage e RLS
- **Bucket:** Novo bucket privado `trip_documents`.
- **Policy de Tabela:** Usuário só lê/insere onde `auth.uid() = user_id`.
- **Policy de Storage:** Somente o *Owner* da viagem faz *GET/PUT*. Uso obrigatório de `createSignedUrl` no Front para expor imagens e PDFs. Acesso anônimo terminantemente bloqueado.

## 5. Estratégias de Integração & Fallback
- **Busca de Voo:** Backend Abstrato (`FlightDataProvider.searchByFlightNumber(flightNumber, date)`). Para o Trip Ready Web, simular mock em Edge Function ou abrir formulário direto até provider ser contratado. Fallback manual primário.
- **Busca de Hotel:** Busca com autocompletar na string com geocoding aberto / MapLibre se disponível; formulário manual se falhar.
- **Importação de Arquivos (V1):** Upload local via input / drag & drop. Parsers rudimentares de OCR via IA para campos estruturados exigindo checagem manual.
- **Modo Offline V1:** Persistência no Frontend via `IndexedDB` e Caching de Assets (Service Workers) mantendo a última versão JSON dos Passes e Códigos QR acessível via web.
- **Integração Motor:** Motor travará compromissos no state *Obrigatório*, populando a Timeline de `itinerary_days` apenas com as âncoras inamovíveis.

## 6. Escopos de Viagem
### Entregas Antes da Viagem (Foco Atual - V1 Realista)
- Perguntas "Já Comprou" + Boarding Pass Visual;
- Input manual / Upload de PDF;
- Carteira da Viagem web com passes confirmados;
- RLS e Storage Seguro;
- Roteiro amarrado aos horários dos compromissos (Tinder "Já comprei" vira trava na agenda).

### Ficando para o Futuro (V2 e Roadmap)
- Parse robusto de Inbound Email (`reservas@voyageflow.app`).
- Live Activities & Apple Watch.
- Live Flight Tracking API (Mudança de portão real-time).
- Modo mapas vetoriais offline inteiros (usaremos apenas base maps temporários).

## 7. Arquivos Previstos (Locais & Reversíveis)
- `src/pages/consumer/TripOnboarding/` (Controlador)
- `src/components/consumer/wallet/FlightPass.tsx`
- `src/components/consumer/wallet/HotelPass.tsx`
- `src/utils/flightDataProvider.ts` (Abstração)
- `src/repositories/TripReservationRepository.ts`

## 8. Riscos Identificados
- Parser visual de Comprovantes via OCR/IA no frontend/edge pode demorar ou causar timeout.
- Sincronizar Service Workers para Offline mode requer cuidado com limite de Cache Storage para imagens pesadas.
- Roteiro ficará bloqueado ("No match") caso o usuário adicione muitos *Fixed Commitments* com horários conflitantes.

---
> **Ação Imediata (Pending Review):** Ao aprovar a documentação, inicializarei as páginas do UI Local (sem rodar push/migrations) para seu review visual do *Wireflow*. O progresso do Bloco B começará aos 20% com este Planejamento Oficial concluído.
