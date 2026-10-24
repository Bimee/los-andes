import { createBrowserClient } from '@supabase/ssr';

/** Cliente para Client Components (subida de fotos desde el panel). Singleton. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
