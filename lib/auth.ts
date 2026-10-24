import { cache } from 'react';
import { redirect } from 'next/navigation';
import { hasSupabaseEnv } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

/**
 * Sesión del panel. cache() evita repetir la verificación cuando
 * el layout y la página la piden en el mismo request.
 */
export const getStaffSession = cache(async () => {
  if (!hasSupabaseEnv()) return { supabase: null, user: null, isStaff: false } as const;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { supabase, user: null, isStaff: false } as const;

  const { data: isStaff } = await supabase.rpc('is_staff');
  return {
    supabase,
    user: { id: String(claims.sub), email: typeof claims.email === 'string' ? claims.email : null },
    isStaff: isStaff === true,
  } as const;
});

/** Para páginas del panel: redirige al login si no hay sesión de staff (o falta configurar Supabase). */
export async function requireStaff() {
  const session = await getStaffSession();
  if (!session.supabase || !session.user || !session.isStaff) redirect('/admin/login');
  return session.supabase;
}
