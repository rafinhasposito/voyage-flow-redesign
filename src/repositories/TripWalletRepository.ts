import { supabase } from '../lib/supabase';

export interface TripReservation {
  id?: string;
  trip_id: string;
  type: 'flight' | 'hotel' | 'train' | 'bus' | 'transfer' | 'car_rental' | 'attraction' | 'show' | 'restaurant' | 'insurance' | 'cruise' | 'other';
  title?: string;
  provider?: string;
  purchase_status: 'booked' | 'wanted' | 'undecided' | 'not_applicable' | 'cancelled';
  confirmation_code?: string;
  start_at?: string;
  end_at?: string;
  location_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_fixed: boolean;
  price?: number;
  currency?: string;
  structured_data?: any;
}

export interface TripDocument {
  id?: string;
  trip_id: string;
  reservation_id?: string;
  document_type?: string;
  file_name: string;
  storage_path: string;
  mime_type?: string;
  file_size?: number;
  parsed_data?: any;
  parse_status?: 'pending' | 'confirmed' | 'failed';
  offline_enabled?: boolean;
}

export class TripWalletRepository {
  static async getReservations(tripId: string): Promise<TripReservation[]> {
    const { data, error } = await supabase
      .from('trip_reservations')
      .select('*')
      .eq('trip_id', tripId)
      .order('start_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async saveReservation(res: TripReservation): Promise<TripReservation> {
    if (res.id) {
      const { data, error } = await supabase
        .from('trip_reservations')
        .update(res)
        .eq('id', res.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('trip_reservations')
        .insert([res])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  static async uploadDocument(
    tripId: string, 
    userId: string, 
    file: File, 
    reservationId?: string
  ): Promise<TripDocument> {
    // Sanitiza o nome do arquivo removendo acentos e espaços que quebram a API do Supabase Storage
    const safeFileName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${safeFileName}`;
    // RLS espera que o primeiro segmento do path seja o tripId: split_part(name, '/', 1)
    const storagePath = `${tripId}/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('trip-documents')
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    const { data, error: dbError } = await supabase
      .from('trip_documents')
      .insert([{
        trip_id: tripId,
        reservation_id: reservationId,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
      }])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  }

  static async getDocuments(tripId: string): Promise<TripDocument[]> {
    const { data, error } = await supabase
      .from('trip_documents')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async deleteReservation(id: string): Promise<void> {
    const { error } = await supabase
      .from('trip_reservations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  static async deleteDocument(doc: TripDocument): Promise<void> {
    // 1. Remove from DB
    const { error: dbError } = await supabase
      .from('trip_documents')
      .delete()
      .eq('id', doc.id);
    
    if (dbError) throw dbError;

    // 2. Remove from Storage
    if (doc.storage_path) {
      await supabase.storage
        .from('trip-documents')
        .remove([doc.storage_path]);
    }
  }

  static async getDocumentSignedUrl(doc: TripDocument): Promise<string> {
    const { data, error } = await supabase.storage
      .from('trip-documents')
      .createSignedUrl(doc.storage_path, 3600); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  }
}
