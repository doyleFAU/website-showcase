// Copy .env.example to .env and run: npm run config
// This file is a reference only — the app imports js/config/supabase.js (generated).

export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
