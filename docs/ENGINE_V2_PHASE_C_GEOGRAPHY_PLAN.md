# Engine V2 Phase C (Geography) Plan

Fase C concluída e tecnicamente aprovada. O pipeline logístico está funcional e as restrições temporais estão em pleno efeito, fechando oficialmente este ciclo.

## Escopo da Implementação
- **Contratos Geográficos**: Interfaces base criadas (`geoContracts.ts`) para suporte de latitude/longitude e estimativas de rotas no motor.
- **Provider Local**: Implementado o `LocalDeterministicGeoProvider` que usa a fórmula matemática de Haversine para cálculo geodésico básico em fallback.
- **Clustering Aproximado**: Atividades são agora selecionadas e ordenadas pela menor distância em linha reta do último ponto conhecido.
- **Segmentos de Trânsito**: Blocos estimativos são intercalados na agenda para representar tempo de percurso (Transit Segments).
- **Indicadores**: Todos os roteamentos locais gerados internamente possuem a marcação `source=local_fallback` e `confidence=low`.
- **Assincronicidade**: A árvore do `SchedulerV1` foi refatorada e agora é totalmente baseada em rotinas assíncronas para comportar dependências geográficas dinâmicas no futuro.
- **Geo Health**: Implementado scanner pré-roteamento que sinaliza quando o Basecamp ou reservas fixas (âncoras) não possuem GPS em seus dados de input.
- **Testes**: Casos de `geography.test.ts` implementados cobrindo clustering primário e health checks, bem como `regression.test.ts` da Fase B, semântico e temporal.

## Limitações Existentes
- Nenhuma API externa (como Google Maps ou Mapbox) ativada.
- Nenhuma integração ou sincronização com o banco de dados oficial (Trip Space).
- Falta roteamento real e realistas sobre relevo, tráfego e direções.
- As distâncias de Haversine não representam caminhos navegáveis por ruas reais.

## Resumo de Encerramento (Decisão Oficial)
- A Fase C está formalmente encerrada sem a adição de um provedor externo, mantendo `local_fallback` via Haversine.
- O tempo de deslocamento foi transformado em um critério bloqueante de alocação de tempo (o deslocamento participa ativamente da agenda, empurrando atividades subsequentes sem violar o horário de reservas fixas).
- Conflitos logísticos são controlados preventivamente pelo **Repair Pass**, garantindo que as atividades flexíveis sejam reorganizadas ou suprimidas se não couberem no itinerário juntamente com as distâncias.
- Não foram realizadas integrações com `trips.itinerary` ou Trip Space.
- O GPS do Basecamp (ex: Arlo NoMad) e a partida (voo) continuam como pendências futuras, mas o engine reflete isso corretamente configurando a prontidão geográfica como `PARTIAL`.
