import { createClient, User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env is missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
export type User = SupabaseUser;

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  supabase.auth.getUser().then(({ data }) => callback(data.user || null));
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => listener.subscription.unsubscribe();
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function handleFirestoreError(error: any) {
  throw error;
}
