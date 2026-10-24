import { createClient } from '@supabase/supabase-js';

/** Cliente anónimo y sin sesión para el menú público (solo lectura, lo limita RLS). */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
