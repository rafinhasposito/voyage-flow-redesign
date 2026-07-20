// src/lib/engineContracts.ts
import { TripReservation } from '../repositories/TripWalletRepository';

export interface TripEngineDTO {
   trip_id: string;
   destination: string;
   start_date: string;
   end_date: string;
   companionship: string;
   budget_level: string;
   pace: string;
   
   // Basecamp explícito para o Motor saber de onde o roteiro parte e onde termina todos os dias
   basecamp?: {
      title: string;
      address: string;
      latitude?: number;
      longitude?: number;
   };

   // Compromissos fixos que o motor NÂO pode alterar (Voos, Trens, Ingressos Comprados)
   fixed_commitments: TripReservation[];

   // Votos do Tinder do Onboarding (ID de Experiências -> "love", "maybe", "reject")
   tinder_votes: Record<string, 'love' | 'maybe' | 'reject' | 'already_bought'>;
   
   preferences: {
      trip_reason?: string;
      currency?: string;
      restrictions?: string[];
   };
}
