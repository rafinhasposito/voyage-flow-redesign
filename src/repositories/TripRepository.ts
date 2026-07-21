import { supabase } from '../lib/supabase';
import type { TripRow, ExperienceRow } from '../lib/adminContracts';
import { ProfileRepository } from './ProfileRepository';

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
            throw error;
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

        await ProfileRepository.ensureCurrentUserProfile(user);

        const { data, error } = await supabase
            .from('trips')
            .insert([{ ...payload, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateTripOnboarding(tripId: string, patch: any) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const current = await this.getTripById(tripId);

        // Merge preferences if present
        if (patch.preferences) {
            patch.preferences = { ...(current.preferences || {}), ...patch.preferences };
        } else {
            patch.preferences = { ...(current.preferences || {}) };
        }

        // Removido o workaround: itinerary agora é uma coluna JSONB nativa na tabela trips.

        const { data, error } = await supabase
            .from('trips')
            .update(patch)
            .eq('id', tripId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('[TRIP_UPDATE_ERROR]', error);
            throw error;
        }

        if (!data) {
            throw new Error("A viagem não foi atualizada. Verifique propriedade e política RLS.");
        }

        return data;
    }

    static async deleteTrip(tripId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', tripId)
            .eq('user_id', user.id);

        if (error) throw error;
    }
}
