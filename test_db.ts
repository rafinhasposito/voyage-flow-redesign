import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: auth, error: errAuth } = await supabase.auth.signInWithPassword({
    email: 'rafael+1784652088892@voyageflow.com',
    password: 'password123'
  });
  if (errAuth) return console.log("Login error:", errAuth);
  console.log("Logged in:", auth.user?.id);

  const { data: trip, error: errTrip } = await supabase.from('trips').insert({
    user_id: auth.user!.id,
    title: 'Test',
    destination: 'NY',
    start_date: '2026-08-01',
    end_date: '2026-08-03',
    status: 'planning'
  }).select().single();
  
  if (errTrip) return console.log("Insert trip error:", errTrip);
  console.log("Trip created:", trip.id);

  // TESTE A
  const { error: errA } = await supabase.from('trips').update({ itinerary: [] }).eq('id', trip.id);
  console.log("TESTE A (itinerary):", errA);

  // TESTE B
  const { error: errB } = await supabase.from('trips').update({ preferences: { current_step: 'workspace' } }).eq('id', trip.id);
  console.log("TESTE B (preferences):", errB);

  // TESTE C
  const { error: errC } = await supabase.from('trips').update({ status: 'planned' }).eq('id', trip.id);
  console.log("TESTE C (status planned):", errC);
}
test();
