import { cache } from 'react';
import { hasSupabaseEnv } from './config';
import { demoCategories, demoSettings, demoVariant } from './demo-data';
import { getStoreStatus, todayIso } from './hours';
import { createPublicClient } from './supabase/public';
import type { Category, CategoryWithProducts, DailyItem, OpeningHour, Product, Settings, StoreStatus } from './types';

export type PublicMenu = {
  settings: Settings;
  hours: OpeningHour[];
  categories: CategoryWithProducts[];
  daily: DailyItem[];
  today: string;
  demo: boolean;
};

const CATEGORY_COLUMNS = 'id, name, slug, image_path, position, is_visible';
const PRODUCT_COLUMNS =
  'id, category_id, name, description, price, price_cash, image_path, is_available, is_visible, position';
const DAILY_COLUMNS = 'id, menu_date, name, description, price, price_cash, image_path, is_available, position';

/** numeric de Postgres llega como string: lo pasamos a número (o null). */
function toPrice(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function normalizeDaily(items: DailyItem[]): DailyItem[] {
  return items.map((d) => ({ ...d, price: toPrice(d.price), price_cash: toPrice(d.price_cash) }));
}

/** Agrupa productos por categoría respetando el orden. Las categorías vacías quedan afuera si skipEmpty. */
export function groupProducts(
  categories: Category[],
  products: Product[],
  skipEmpty = false,
): CategoryWithProducts[] {
  const byCat = new Map<string, Product[]>();
  for (const p of products) {
    const list = byCat.get(p.category_id) ?? [];
    list.push({ ...p, price: toPrice(p.price), price_cash: toPrice(p.price_cash) });
    byCat.set(p.category_id, list);
  }
  return categories
    .map((c) => ({ ...c, products: byCat.get(c.id) ?? [] }))
    .filter((c) => !skipEmpty || c.products.length > 0);
}

/**
 * Todo lo que necesita el menú público, en una sola tanda de consultas en paralelo.
 * cache(): la página y generateMetadata la piden en el mismo request y se lee una sola vez.
 * `demo` solo se usa sin Supabase (ver demoVariant).
 */
export const getPublicMenu = cache(async (demo?: string): Promise<PublicMenu> => {
  const today = todayIso();

  if (!hasSupabaseEnv()) {
    const variant = demoVariant(demo, today);
    return {
      settings: variant.settings,
      hours: variant.hours,
      categories: demoCategories,
      daily: variant.daily,
      today,
      demo: true,
    };
  }

  const supabase = createPublicClient();
  const [settings, hours, categories, products, daily] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('opening_hours').select('weekday, is_open, opens_at, closes_at').order('weekday'),
    supabase
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .eq('is_visible', true)
      .order('position')
      .order('created_at'),
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('is_visible', true)
      .order('position')
      .order('created_at'),
    supabase
      .from('daily_menu_items')
      .select(DAILY_COLUMNS)
      .eq('menu_date', today)
      .order('position')
      .order('created_at'),
  ]);

  const error = settings.error ?? hours.error ?? categories.error ?? products.error ?? daily.error;
  if (error) throw new Error(`No se pudo leer el menú: ${error.message}`);

  return {
    settings: (settings.data as Settings | null) ?? {
      ...demoSettings,
      phone: null,
      whatsapp: null,
      address: null,
    },
    hours: (hours.data as OpeningHour[]) ?? [],
    categories: groupProducts(
      (categories.data as Category[]) ?? [],
      (products.data as Product[]) ?? [],
      true,
    ),
    daily: normalizeDaily((daily.data as DailyItem[]) ?? []),
    today,
    demo: false,
  };
});

export function menuStatus(menu: PublicMenu): StoreStatus {
  return getStoreStatus({
    hours: menu.hours,
    closedUntil: menu.settings.closed_until,
    closedMessage: menu.settings.closed_message,
  });
}

/** El parámetro ?demo= de la URL (solo tiene efecto sin Supabase). */
export function demoParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export { CATEGORY_COLUMNS, PRODUCT_COLUMNS, DAILY_COLUMNS };
