import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc: any, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env['VITE_SUPABASE_URL'] || '';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const titles = [
    'Jantar K-Town',
    'Festa no The Edge',
    'Shake Shack',
    "Joe's Pizza",
    "Juliana's Pizza",
    'Tick Tock Diner',
    'Sunday Brunch',
    'One40 Rooftop Bar'
  ];

  for (const title of titles) {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .ilike('title', `%${title}%`)
      .limit(3);
    
    if (error) {
      console.error('Error fetching', title, error);
      continue;
    }
    
    console.log(`\n=== ${title} ===`);
    data.forEach(d => {
      console.log(JSON.stringify({
         id: d.id,
         title: d.title,
         type: d.type,
         category: d.category,
         tags: d.tags,
         duration_minutes: d.duration_minutes
      }, null, 2));
    });
  }
}

run();
