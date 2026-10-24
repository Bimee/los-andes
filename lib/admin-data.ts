import { CATEGORY_COLUMNS, DAILY_COLUMNS, groupProducts, normalizeDaily, PRODUCT_COLUMNS } from './data';
import type { createClient } from './supabase/server';
import type { Category, CategoryWithProducts, DailyItem, OpeningHour, Product, Settings } from './types';

// Lecturas del panel: usan el cliente con sesión, así RLS deja ver también lo oculto.

type DB = Awaited<ReturnType<typeof createClient>>;

function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`No se pudo leer ${what}: ${result.error.message}`);
  return result.data as T;
}

export async function getCarta(db: DB): Promise<CategoryWithProducts[]> {
  const [categories, products] = await Promise.all([
    db.from('categories').select(CATEGORY_COLUMNS).order('position').order('created_at'),
    db.from('products').select(PRODUCT_COLUMNS).order('position').order('created_at'),
  ]);
  return groupProducts(
    check(categories, 'las categorías') as Category[],
    check(products, 'los platos') as Product[],
  );
}

export async function getSettings(db: DB): Promise<Settings> {
  const result = await db.from('settings').select('*').eq('id', 1).maybeSingle();
  const settings = check(result, 'los datos del local') as Settings | null;
  if (!settings) throw new Error('Falta la fila de settings. Corré supabase/schema.sql.');
  return settings;
}

export async function getHours(db: DB): Promise<OpeningHour[]> {
  const result = await db.from('opening_hours').select('weekday, is_open, opens_at, closes_at').order('weekday');
  return check(result, 'los horarios') as OpeningHour[];
}

export async function getDailyItems(db: DB, date: string): Promise<DailyItem[]> {
  const result = await db
    .from('daily_menu_items')
    .select(DAILY_COLUMNS)
    .eq('menu_date', date)
    .order('position')
    .order('created_at');
  return normalizeDaily(check(result, 'el menú del día') as DailyItem[]);
}

/** Último día anterior a `date` que tenga platos cargados. */
export async function getPreviousMenuDate(db: DB, date: string): Promise<string | null> {
  const result = await db
    .from('daily_menu_items')
    .select('menu_date')
    .lt('menu_date', date)
    .order('menu_date', { ascending: false })
    .limit(1);
  const rows = check(result, 'los menús anteriores') as { menu_date: string }[];
  return rows[0]?.menu_date ?? null;
}
