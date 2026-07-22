import { TripEngineInputV1 } from './contracts';

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  field?: string;
}

export interface TripEngineInputHealth {
  ready: boolean;
  critical: HealthIssue[];
  warnings: HealthIssue[];
  missingCriticalData: string[];
  missingOptionalData: string[];
  confidence: 'high' | 'medium' | 'low';
}

export class InputHealthValidator {
  static validate(input: TripEngineInputV1): TripEngineInputHealth {
    const critical: HealthIssue[] = [];
    const warnings: HealthIssue[] = [];
    const missingCritical: string[] = [];
    const missingOptional: string[] = [];
    
    // Validate Dates
    if (!input.startDate || !input.endDate) {
      missingCritical.push('startDate/endDate');
      critical.push({ severity: 'critical', message: 'Datas da viagem estão ausentes.', field: 'dates' });
    } else {
      const sDate = new Date(input.startDate);
      const eDate = new Date(input.endDate);
      if (sDate > eDate) {
         critical.push({ severity: 'critical', message: 'Data de término é anterior à data de início.', field: 'dates' });
      }
    }

    // Validate Basecamp
    if (!input.basecamp) {
       missingOptional.push('basecamp');
       warnings.push({ severity: 'warning', message: 'Nenhum hotel ou basecamp fornecido. A otimização logística será reduzida.', field: 'basecamp' });
    } else if (!input.basecamp.lat || !input.basecamp.lng) {
       missingOptional.push('basecamp.coordinates');
       warnings.push({ severity: 'warning', message: 'Hotel não possui coordenadas GPS. O agrupamento geográfico usará fallback.', field: 'basecamp.coordinates' });
    }

    // Validate Flights
    if (input.flightSegments.length === 0) {
       warnings.push({ severity: 'warning', message: 'Nenhum voo informado. O roteiro começará e terminará em horários padrão.', field: 'flights' });
    } else {
       input.flightSegments.forEach(segment => {
         if (!segment.departureTimezone || !segment.arrivalTimezone) {
            warnings.push({ severity: 'warning', message: `Fuso horário ausente para o voo ${segment.flightNumber}.`, field: 'flight.timezone' });
         }
       });
       if (input.arrivalFlight && input.departureFlight) {
         const arr = new Date(input.arrivalFlight.arrivalLocalDateTime);
         const dep = new Date(input.departureFlight.departureLocalDateTime);
         if (arr > dep) {
            critical.push({ severity: 'critical', message: 'Chegada ao destino ocorre após a partida.', field: 'flight.dates' });
         }
       }
    }

    // Validate Fixed Reservations
    input.fixedReservations.forEach(res => {
      if (!res.date || !res.startTime || !res.endTime) {
        critical.push({ severity: 'critical', message: `Reserva fixa "${res.type}" não possui horário exato definido.`, field: 'fixedReservations.time' });
      }
      if (!res.location && !res.coordinates) {
        warnings.push({ severity: 'warning', message: `Reserva fixa "${res.type}" sem localização. Pode gerar deslocamentos irreais.`, field: 'fixedReservations.location' });
      }
    });

    const isReady = critical.length === 0;
    const confidence = isReady && warnings.length === 0 ? 'high' : isReady && warnings.length < 3 ? 'medium' : 'low';

    return {
      ready: isReady,
      critical,
      warnings,
      missingCriticalData: missingCritical,
      missingOptionalData: missingOptional,
      confidence
    };
  }
}
