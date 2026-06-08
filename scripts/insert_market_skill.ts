import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE keys in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey as string);

async function run() {
  try {
    const skill = {
      skill_name: 'AI Agent Engineering',
      demand_score: 94,
      growth: '+12%',
      forecast: 'High'
    };

    // Check if exists
    const { data: existing } = await supabase.from('trends').select('*').eq('skill_name', skill.skill_name).limit(1).maybeSingle();
    if (existing) {
      console.log('Skill already exists:', existing.skill_name);
      process.exit(0);
    }

    const { data, error } = await supabase.from('trends').insert(skill).select().limit(1).maybeSingle();
    if (error) {
      console.error('Insert error (table may not exist):', error.message);
      process.exit(1);
    }
    console.log('Inserted skill:', data);
    process.exit(0);
  } catch (e: any) {
    console.error('Error running script:', e.message || e);
    process.exit(1);
  }
}

run();
