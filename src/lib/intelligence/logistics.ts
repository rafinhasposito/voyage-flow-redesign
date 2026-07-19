export type LogisticsReasonCode = 
  | "CLOSED_ON_DATE"
  | "CLOSED_AT_TIME"
  | "CLOSING_SOON"
  | "INSUFFICIENT_VISIT_TIME"
  | "TRANSIT_TIME_UNKNOWN"
  | "TRANSFER_TOO_TIGHT"
  | "ARRIVAL_AFTER_CLOSING"
  | "OPERATING_HOURS_UNKNOWN"
  | "EXCEPTION_CLOSURE";

export type LogisticsReason = {
  code: LogisticsReasonCode;
  message: string;
};

export type LogisticsAdjustment = {
  type: "MOVE_TIME" | "REORDER" | "MOVE_DAY" | "REPLACE";
  reason: string;
};

export type LogisticsEvaluation = {
  feasible: boolean;
  blockers: LogisticsReason[];
  warnings: LogisticsReason[];
  suggestedAdjustment?: LogisticsAdjustment;
};

// Represents the schema types for logistics
export type OperatingHour = {
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  opens_at: string | null; // "HH:MM:SS"
  closes_at: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
};

export type OperatingException = {
  exception_date: string; // "YYYY-MM-DD"
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

export type TransitOption = {
  origin_id?: string;
  destination_id?: string;
  mode: "walking" | "transit" | "driving" | "bicycling";
  duration_minutes: number;
};

export class LogisticsEngine {
  static evaluateFeasibility(
    proposedDate: string, // "YYYY-MM-DD"
    proposedTime: string | null, // "HH:MM"
    durationHours: number,
    operatingHours: OperatingHour[] | null | undefined,
    exceptions: OperatingException[] | null | undefined,
    transitTimeMinutes: number | null, // From previous stop
    windowEndTime: string | null, // "HH:MM" max available time
    previousEndTime: string | null = null // "HH:MM"
  ): LogisticsEvaluation {
    const blockers: LogisticsReason[] = [];
    const warnings: LogisticsReason[] = [];
    let suggestedAdjustment: LogisticsAdjustment | undefined = undefined;

    // 1. Unknowns
    if (!operatingHours || operatingHours.length === 0) {
      warnings.push({ code: "OPERATING_HOURS_UNKNOWN", message: "Horário de funcionamento desconhecido." });
    }

    if (transitTimeMinutes === null) {
      warnings.push({ code: "TRANSIT_TIME_UNKNOWN", message: "Tempo de deslocamento desconhecido." });
    }

    if (!proposedTime) {
       // If no time is proposed, we just check if it's open that day
       if (operatingHours && operatingHours.length > 0) {
         const dayOfWeek = new Date(proposedDate).getUTCDay();
         const dayHours = operatingHours.find(h => h.day_of_week === dayOfWeek);
         if (!dayHours) {
           warnings.push({ code: "OPERATING_HOURS_UNKNOWN", message: "Horário não cadastrado para este dia da semana." });
         } else if (dayHours.is_closed) {
           blockers.push({ code: "CLOSED_ON_DATE", message: "Fechado neste dia da semana." });
           suggestedAdjustment = { type: "MOVE_DAY", reason: "Tente outro dia em que a atração esteja aberta." };
         }
       }

       // Exception overrides
       if (exceptions) {
         const exc = exceptions.find(e => e.exception_date === proposedDate);
         if (exc && exc.is_closed) {
           // Overrides normal
           blockers.push({ code: "EXCEPTION_CLOSURE", message: "Fechado nesta data específica." });
           suggestedAdjustment = { type: "MOVE_DAY", reason: "Atração fechada excepcionalmente nesta data." };
         }
       }
       
       return {
         feasible: blockers.length === 0,
         blockers,
         warnings,
         suggestedAdjustment
       };
    }

    // proposedTime is provided ("HH:MM")
    // Parse time to minutes from midnight
    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const proposedMinutes = timeToMinutes(proposedTime);
    const endMinutes = proposedMinutes + (durationHours * 60);

    // Exceptions First
    let dayHours: { opens_at: string | null; closes_at: string | null; is_closed: boolean; is_24_hours: boolean } | undefined;
    let isException = false;
    
    if (exceptions) {
      const exc = exceptions.find(e => e.exception_date === proposedDate);
      if (exc) {
        dayHours = { ...exc, is_24_hours: false }; // Assuming exceptions don't specify 24h usually, but we could
        isException = true;
      }
    }

    if (!dayHours && operatingHours) {
      const dayOfWeek = new Date(proposedDate).getUTCDay();
      dayHours = operatingHours.find(h => h.day_of_week === dayOfWeek);
    }

    if (dayHours) {
      if (dayHours.is_closed) {
        blockers.push({ 
          code: isException ? "EXCEPTION_CLOSURE" : "CLOSED_ON_DATE", 
          message: isException ? "Fechado excepcionalmente nesta data." : "Fechado neste dia da semana." 
        });
        suggestedAdjustment = { type: "MOVE_DAY", reason: "Tente outro dia." };
      } else if (!dayHours.is_24_hours && dayHours.opens_at && dayHours.closes_at) {
        const openMins = timeToMinutes(dayHours.opens_at);
        const closeMins = timeToMinutes(dayHours.closes_at);
        
        if (proposedMinutes < openMins || proposedMinutes >= closeMins) {
          blockers.push({ code: "CLOSED_AT_TIME", message: "Fechado no horário previsto." });
          suggestedAdjustment = { type: "MOVE_TIME", reason: "Ajuste o horário para dentro do período de funcionamento." };
        } else if (endMinutes > closeMins) {
          // It opens, but closes before the visit is done
          if (closeMins - proposedMinutes < 60) {
             warnings.push({ code: "ARRIVAL_AFTER_CLOSING", message: "Chegada muito próxima do fechamento." });
          } else {
             warnings.push({ code: "CLOSING_SOON", message: "Pouco tempo disponível antes do fechamento." });
          }
          blockers.push({ code: "INSUFFICIENT_VISIT_TIME", message: "Duração planejada ultrapassa o horário de fechamento." });
          suggestedAdjustment = { type: "MOVE_TIME", reason: "Chegue mais cedo para aproveitar a experiência." };
        }
      }
    }

    if (windowEndTime) {
      const windowEndMins = timeToMinutes(windowEndTime);
      if (endMinutes > windowEndMins) {
        blockers.push({ code: "INSUFFICIENT_VISIT_TIME", message: "A experiência não cabe na janela de tempo disponível." });
        if (!suggestedAdjustment) {
          suggestedAdjustment = { type: "REORDER", reason: "Tente colocar esta parada mais cedo no roteiro." };
        }
      }
    }
    
    // Transfer logic
    if (transitTimeMinutes !== null && previousEndTime && proposedTime) {
      const prevEndMins = timeToMinutes(previousEndTime);
      const nextStartMins = timeToMinutes(proposedTime);
      const availableTransferMinutes = nextStartMins - prevEndMins;
      
      if (availableTransferMinutes < transitTimeMinutes) {
        warnings.push({ code: "TRANSFER_TOO_TIGHT", message: "Deslocamento muito apertado." });
      }
    }

    return {
      feasible: blockers.length === 0,
      blockers,
      warnings,
      suggestedAdjustment
    };
  }
}
