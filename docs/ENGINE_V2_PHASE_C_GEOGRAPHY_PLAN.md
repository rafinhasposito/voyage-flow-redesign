# Engine V2 Phase C (Geography) Plan

Fase C implementada e tecnicamente auditada, aguardando validação visual. Não concluída e não liberada para merge ou provider externo.

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
