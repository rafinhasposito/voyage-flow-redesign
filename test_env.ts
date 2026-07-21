import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
let url = '';
let anon = '';
let service = '';

lines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) anon = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) service = line.split('=')[1].trim();
});

console.log("URL:", url);
console.log("Anon Length:", anon.length);
console.log("Service Role Length:", service.length);

const projectRef = url.match(/https:\/\/([a-z0-9]+)\.supabase/)?.[1] || 'unknown';
console.log("Project Ref:", projectRef);
