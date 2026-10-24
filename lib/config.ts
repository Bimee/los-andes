// Configuración general del sitio.

/** Zona horaria del local: define "hoy" y el estado abierto/cerrado. */
export const TIMEZONE = 'America/Argentina/Cordoba';

/** Bucket de Supabase Storage para las fotos de los platos. */
export const IMAGE_BUCKET = 'platos';

/** Crédito en el pie del menú público. Dejá href vacío para que no sea link. */
export const CREDIT = {
  label: 'Sitio hecho por BIME Studio',
  href: '',
};

/** Mensaje que se precarga al abrir WhatsApp desde el menú. */
export const WHATSAPP_GREETING = 'Hola, quería hacer un pedido: ';

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * URL pública de una foto guardada en Storage. Una URL absoluta o una ruta local
 * ("/muestra/flan.webp", fotos de muestra del modo demo) se devuelve tal cual.
 */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|\/)/.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
