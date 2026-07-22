import { TripEngineInputV1 } from './contracts';

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  field?: string;
}

export interface TripEngineInputHealth {
  ready: boolean;
  isReadyForReview: boolean;
  isReadyForIntegration: boolean;
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
       warnings.push({ severity: 'warning', message: 'Nenhum hotel ou basecamp fornecido. A logística assumirá comportamento default sem localização âncora.', field: 'basecamp' });
    } else if (!input.basecamp.lat || !input.basecamp.lng) {
       missingOptional.push('basecamp.coordinates');
       warnings.push({ severity: 'warning', message: 'Hospedagem sem GPS. Sugestões ao redor e deslocamentos perdem precisão temporal.', field: 'basecamp.coordinates' });
    }

    // Validate Flights
    let tripStartMs = -1;
    let tripEndMs = -1;

    if (input.flightSegments.length === 0) {
       warnings.push({ severity: 'warning', message: 'Viagem sem voo informado. Roteiro começará e terminará em horários abertos locais.', field: 'flights' });
    } else {
       if (input.arrivalFlight) {
          const arrStr = input.arrivalFlight.arrivalLocalDateTime;
          if (arrStr) {
             const dateStr = arrStr.split('T')[0];
             const [h, m] = (arrStr.split('T')[1] || '00:00:00').split(':').map(Number);
             tripStartMs = new Date(dateStr).getTime() + (h * 3600000) + (m * 60000);
          }
       } else {
          warnings.push({ severity: 'warning', message: 'Voo de chegada não pôde ser mapeado. Início do roteiro fica cego.', field: 'flight.arrival' });
       }

       if (input.departureFlight) {
          const depStr = input.departureFlight.departureLocalDateTime;
          if (depStr) {
             const dateStr = depStr.split('T')[0];
             const [h, m] = (depStr.split('T')[1] || '00:00:00').split(':').map(Number);
             tripEndMs = new Date(dateStr).getTime() + (h * 3600000) + (m * 60000);
          }
       } else {
          warnings.push({ severity: 'warning', message: 'Voo de partida não pôde ser mapeado. Fim do roteiro fica cego.', field: 'flight.departure' });
       }

       if (tripStartMs !== -1 && tripEndMs !== -1 && tripStartMs > tripEndMs) {
          critical.push({ severity: 'critical', message: 'Chegada ao destino ocorre após a partida (Datas de voo invertidas/corrompidas).', field: 'flight.dates' });
       }
    }

    // Validate Fixed Reservations and Logistical Bounds
    input.fixedReservations.forEach(res => {
      if (!res.date || !res.startTime || !res.endTime) {
        critical.push({ severity: 'critical', message: `Reserva fixa "${res.type}" não possui horário exato definido.`, field: 'fixedReservations.time' });
        return;
      }

      // Check TRAVELER_NOT_IN_DESTINATION
      let sTime = res.startTime.replace('Z', '');
      const dateStr = res.date;
      const [h, m] = (sTime.split('T')[1] || '00:00:00').split(':').map(Number);
      const resStartMs = new Date(dateStr).getTime() + (h * 3600000) + (m * 60000);

      if (tripStartMs !== -1 && resStartMs < tripStartMs) {
         critical.push({ severity: 'critical', message: `[TRAVELER_NOT_IN_DESTINATION] Reserva fixa '${res.title || res.type}' agendada antes da chegada no destino.`, field: 'logistics.bounds' });
      }

      if (tripEndMs !== -1 && resStartMs > tripEndMs) {
         critical.push({ severity: 'critical', message: `[TRAVELER_NOT_IN_DESTINATION] Reserva fixa '${res.title || res.type}' agendada após a partida do destino.`, field: 'logistics.bounds' });
      }

      if (!res.location && !res.coordinates) {
        warnings.push({ severity: 'warning', message: `Reserva fixa "${res.type}" sem localização. Pode gerar deslocamentos irreais.`, field: 'fixedReservations.location' });
      }
    });

    const health: TripEngineInputHealth = {
      ready: critical.length === 0,
      isReadyForReview: true, // Always ready for review if the draft renders, can be updated later if needed
      isReadyForIntegration: false, // Default false until proven ready
      critical: critical,
      warnings: warnings,
      missingCriticalData: missingCritical,
      missingOptionalData: missingOptional,
      confidence: critical.length > 0 ? 'low' : warnings.length > 0 ? 'medium' : 'high'
    };

    // Calculate Integration Readiness
    if (health.critical.length > 0 || !input.departureFlight || !input.arrivalFlight) {
       health.isReadyForIntegration = false;
    } else {
       health.isReadyForIntegration = true;
    }

    return health;
  }
}
