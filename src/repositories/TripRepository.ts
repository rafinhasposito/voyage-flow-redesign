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
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error, status } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId);
            
        if (error) {
            console.error("[DIAGNOSTICS] Supabase error:", error.message, "Status:", status);
            throw error;
        }

        if (!data || data.length === 0) {
            console.error(`[DIAGNOSTICS] getTripById: Sessão existe? ${!!session}. User ID existe? ${!!user?.id}. TripId: ${tripId}. Linhas visíveis: 0.`);
            if (user?.id) {
                console.error(`[DIAGNOSTICS] User.id ativo: ${user.id.substring(0,4)}...${user.id.substring(user.id.length-4)}`);
            }
            throw new Error(`Viagem não encontrada. Verifique se a viagem pertence ao usuário ativo ou se existe sessão.`);
        }

        if (data.length > 1) {
             console.error(`[DIAGNOSTICS] Múltiplas viagens encontradas com id ${tripId}`);
        }

        return data[0];
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

    static async applyApprovedItineraryDraft(tripId: string, payload: any[], expectedVersion: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const current = await this.getTripById(tripId);

        // Concurrency control
        if (current.updated_at !== expectedVersion) {
            throw new Error("ITINERARY_CHANGED_SINCE_PREVIEW");
        }

        // Idempotency check via deterministic hash
        // Using basic string hash as crypto might not be available in browser environment directly if this is called from client
        // Wait, TripRepository is client side! We can't use crypto module. We can use a simple hash function or subtle crypto.
        // A simple string-based hash:
        const payloadStr = JSON.stringify(payload);
        let draftHash = 0;
        for (let i = 0; i < payloadStr.length; i++) {
            const char = payloadStr.charCodeAt(i);
            draftHash = ((draftHash << 5) - draftHash) + char;
            draftHash = draftHash & draftHash; // Convert to 32bit integer
        }
        const hashStr = draftHash.toString();

        const metadata = payload[0];
        if (metadata && metadata._isMetadata) {
             if (current.itinerary && current.itinerary.length > 0 && current.itinerary[0]?._isMetadata) {
                  if (current.itinerary[0].draftHash === hashStr) {
                       return { status: 'ALREADY_APPLIED', data: current };
                  }
             }
             metadata.draftHash = hashStr;
        }

        // Preservação de intenção e reservas
        const getStableId = (act: any) => act.reservationId || act.sourceExperienceId || act.id || act.experience?.id;
        
        const currentFixedIds = new Set<string>();
        if (Array.isArray(current.itinerary)) {
            current.itinerary.forEach((day: any) => {
                if (day.activities && Array.isArray(day.activities)) {
                    day.activities.forEach((act: any) => {
                        if (act.isFixed || act.manualLock) currentFixedIds.add(getStableId(act));
                    });
                } else if (day.attractions && Array.isArray(day.attractions)) {
                    day.attractions.forEach((act: any) => {
                         if (act.manualMetadata?.locked || act.is_must_see) currentFixedIds.add(getStableId(act));
                    });
                }
            });
        }
        
        const payloadFixedIds = new Set<string>();
        payload.forEach((item: any) => {
             if (item.activities && Array.isArray(item.activities)) {
                  item.activities.forEach((act: any) => {
                       if (act.isFixed || act.manualLock) payloadFixedIds.add(getStableId(act));
                  });
             }
        });
        
        for (const id of currentFixedIds) {
             if (!payloadFixedIds.has(id)) {
                  throw new Error(`BLOCKED_BY_CONFLICT: item protegido (id: ${id}) foi removido.`);
             }
        }

        const { data, error } = await supabase
            .from('trips')
            .update({ itinerary: payload })
            .eq('id', tripId)
            .eq('user_id', user.id)
            .eq('updated_at', expectedVersion)
            .select()
            .single();

        if (error) {
             if (error.code === 'PGRST116') {
                 throw new Error("ITINERARY_CHANGED_SINCE_PREVIEW");
             }
             throw new Error("PERSISTENCE_FAILED: " + error.message);
        }

        // Readback
        const readback = await this.getTripById(tripId);
        if (!readback.itinerary || readback.itinerary.length !== payload.length) {
             throw new Error("READBACK_MISMATCH");
        }
        if (metadata && metadata._isMetadata) {
             if (readback.itinerary[0]?.draftHash !== metadata.draftHash) {
                 throw new Error("READBACK_MISMATCH");
             }
        }
        
        return { status: 'APPLIED', data: readback };
    }
}
