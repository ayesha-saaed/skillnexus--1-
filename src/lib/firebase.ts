import { supabase, type User as SupabaseUser, getAccessToken } from './supabase';

export { supabase };
export type User = SupabaseUser;
export { getAccessToken };

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
