import { TripRepository } from '../repositories/TripRepository';
import { TripWalletRepository } from '../repositories/TripWalletRepository';
import { ExperienceRepository } from '../repositories/ExperienceRepository';
import { EngineInputBuilder } from '../domain/itinerary-engine/inputBuilder';
import { SchedulerV1 } from '../domain/itinerary-engine/schedulerV1';
import { LocalDeterministicGeoProvider } from '../domain/itinerary-engine/geoProvider';

export class TripItineraryGenerationService {
  /**
   * Orchestrates the complete generation pipeline for an itinerary using Engine V2.
   * 1. Loads trip, preferences, reservations, and catalog.
   * 2. Normalizes input for the engine.
   * 3. Generates the draft via SchedulerV1.
   * 4. Persists the generated itinerary with V2 metadata into the trip.
   */
  static async generateAndPersist(tripId: string): Promise<any> {
    // 1. Load Trip
    const trip = await TripRepository.getTripById(tripId);
    if (!trip) throw new Error('Viagem não encontrada.');
    if (!trip.destination) throw new Error('Destino não definido para a viagem.');
    if (!trip.start_date || !trip.end_date) throw new Error('Datas da viagem não definidas.');

    // 2. Load Reservations
    const reservations = await TripWalletRepository.getReservations(tripId);

    // 3. Load Catalog (only valid, published experiences for the destination)
    const rawCatalog = await ExperienceRepository.getByDestination(trip.destination);
    const catalog = rawCatalog.filter(exp => exp.is_published && exp.type !== 'transport');

    // 4. Build Engine Input
    const engineInput = EngineInputBuilder.build(trip, reservations, catalog);
    
    // Hash input to detect later staleness
    const inputHash = this.generateHash(JSON.stringify({
      preferences: trip.preferences,
      reservations: reservations.map(r => r.id).join(','),
      dates: `${trip.start_date}_${trip.end_date}`
    }));

    // 5. Run Engine V2 Generation
    const geoProvider = new LocalDeterministicGeoProvider();
    const draftItinerary = await SchedulerV1.generate(engineInput, geoProvider);

    if (!draftItinerary.days || draftItinerary.days.length === 0) {
      throw new Error('A Engine não conseguiu gerar nenhum dia para o roteiro.');
    }

    // 6. Map to PersistedTripItineraryV2 Format
    const persistedFormat = draftItinerary.days.map(day => {
      return {
        day: day.dayNumber,
        dateStr: day.date,
        theme: day.theme,
        activities: day.activities.map(act => ({
          id: act.id,
          sourceExperienceId: act.sourceExperienceId,
          type: act.type,
          title: act.title,
          description: act.description,
          startTime: act.startTime,
          endTime: act.endTime,
          durationMinutes: act.duration,
          location_lat: act.coordinates?.lat,
          location_lng: act.coordinates?.lng,
          isBooked: act.source === 'reservation',
          isFixed: act.isFixed,
          manualLock: act.isLocked,
          image: act.imageUrl || catalog.find(c => c.id === act.sourceExperienceId)?.image,
          costUSD: act.costUSD || catalog.find(c => c.id === act.sourceExperienceId)?.costUSD
        }))
      };
    });

    const itineraryWithMeta = [
      {
        _isMetadata: true,
        engineVersion: '2.0.0',
        generatedAt: new Date().toISOString(),
        inputHash,
        stats: {
          votes: Object.keys(engineInput.matchVotes).length,
          rejections: Object.values(engineInput.matchVotes).filter(v => v === 'no').length,
          likes: Object.values(engineInput.matchVotes).filter(v => v === 'yes' || v === 'love').length,
        }
      },
      ...persistedFormat
    ];

    // 7. Persist to DB
    const updatedTrip = await TripRepository.updateTrip(tripId, {
      itinerary: itineraryWithMeta
    });

    return updatedTrip;
  }

  static async generatePreview(tripId: string): Promise<any> {
    const trip = await TripRepository.getTripById(tripId);
    if (!trip) throw new Error('Viagem não encontrada.');
    
    const reservations = await TripWalletRepository.getReservations(tripId);
    const rawCatalog = await ExperienceRepository.getByDestination(trip.destination);
    const catalog = rawCatalog.filter(exp => exp.is_published && exp.type !== 'transport');

    const engineInput = EngineInputBuilder.build(trip, reservations, catalog);
    const inputHash = this.generateHash(JSON.stringify({
      preferences: trip.preferences,
      reservations: reservations.map(r => r.id).join(','),
      dates: `${trip.start_date}_${trip.end_date}`
    }));

    const geoProvider = new LocalDeterministicGeoProvider();
    const draftItinerary = await SchedulerV1.generate(engineInput, geoProvider);

    return {
      metadata: { inputHash },
      diagnostics: {
        eligibleCandidates: catalog.filter(item => {
          const vote = engineInput.matchVotes[item.id];
          return vote !== 'REJECT';
        })
      },
      itinerary: draftItinerary.days
    };
  }

  private static generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
