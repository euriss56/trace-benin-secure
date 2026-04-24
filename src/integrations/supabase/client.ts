import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Diagnostic log (visible in browser console on Vercel)
console.log('[supabase] URL:', supabaseUrl);
console.log('[supabase] Anon key present:', Boolean(supabaseAnonKey));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ' +
      "doivent être définies dans les variables d'environnement (Vercel → Settings → Environment Variables)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = true;
