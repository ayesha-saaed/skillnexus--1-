import { createClient } from '@supabase/supabase-js';

// TODO: Configure real Supabase credentials in .env
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.warn('⚠️ Supabase using dev mode - update .env for production');


export const supabase = createClient(supabaseUrl, supabaseKey);


