// Paste your keys from Supabase → Project Settings → API
export const SUPABASE_URL = "https://xoyattwlizrtjgbrxzca.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveWF0dHdsaXpydGpnYnJ4emNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjI0NDAsImV4cCI6MjA5OTQzODQ0MH0.LdLjv0veeAv5WxP25uFAD7IGMQtqWtdMf97wVmiUztI";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
