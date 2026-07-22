import { supabase } from './src/lib/supabase';
import { TripRepository } from './src/repositories/TripRepository';
import { TripWalletRepository } from './src/repositories/TripWalletRepository';
import { ExperienceRepository } from './src/repositories/ExperienceRepository';

async function run() {
    const tripId = 'f116cf27-03e8-46af-98dd-4b437f30cb4d';
    const trip = await TripRepository.getTripById(tripId);
    const res = await TripWalletRepository.getReservations(tripId);
    console.log("TRIP MATCH VOTES:", JSON.stringify(trip.preferences?.match_votes || trip.preferences?.matchVotes || trip.match_votes || {}));
    
    const catalog = await ExperienceRepository.getByDestination(trip.destination);
    console.log("CATALOG SIZE:", catalog.length);
    if (catalog.length > 0) {
       console.log("SAMPLE EXPERIENCE:", JSON.stringify(catalog[0], null, 2));
    }
}
run().catch(console.error);
