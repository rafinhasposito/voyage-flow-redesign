import { supabase } from '../lib/supabase';
import type { TripRow, ExperienceRow } from '../lib/adminContracts'; // Vou criar DTO ou aproveitar

export interface CreateTripDTO {
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    hotel_name?: string;
    hotel_lat?: number;
    hotel_lng?: number;
    companionship?: string;
    pace?: string;
    budget_level?: string;
    status?: string;
}

export class TripRepository {
    static async getMyTrips() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar viagens", error);
            throw error; // Vai estourar PGRST205 se a tabela não existir, que é a verdade atual
        }
        return data || [];
    }

    static async getTripById(tripId: string) {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();
        if (error) throw error;
        return data;
    }

    static async createTrip(payload: CreateTripDTO) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data, error } = await supabase
            .from('trips')
            .insert([{ ...payload, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
