import { CARTA } from './carta';
import { efectivoMuestra, FOTO_CATEGORIA, fotoMuestra, MUESTRA } from './demo-muestra';
import type { CategoryWithProducts, DailyItem, OpeningHour, Settings } from './types';

// Datos para ver el sitio sin Supabase (npm run dev sin .env.local).
// Platos y categorías: la carta real (lib/carta.ts).
// Precios, descripciones y fotos: de muestra (lib/demo-muestra.ts), solo para mostrar el diseño.
// El menú del día también es de ejemplo: cambia todos los días y lo carga la encargada.

export const demoSettings: Settings = {
  business_name: 'Los Andes',
  tagline: 'Rotisería · comida casera',
  phone: '351 636-0127',
  whatsapp: '5493516360127',
  address: 'Ruta E-55 esquina República, La Calera',
  closed_until: null,
  closed_message: null,
};

export const demoHours: OpeningHour[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  is_open: weekday !== 0,
  opens_at: '10:00',
  closes_at: '15:30',
}));

export const demoCategories: CategoryWithProducts[] = CARTA.map(({ name, slug, dishes }, ci) => ({
  id: `demo-cat-${ci}`,
  name,
  slug,
  image_path: FOTO_CATEGORIA[slug] ? fotoMuestra(FOTO_CATEGORIA[slug]) : null,
  position: ci,
  is_visible: true,
  products: dishes.map(([dishName, description = null], pi) => {
    const muestra = MUESTRA[dishName];
    return {
      id: `demo-prod-${ci}-${pi}`,
      category_id: `demo-cat-${ci}`,
      name: dishName,
      description: muestra?.desc ?? description,
      price: muestra?.precio ?? null,
      price_cash: muestra && !muestra.sinDescuento ? efectivoMuestra(muestra.precio) : null,
      image_path: muestra ? fotoMuestra(muestra.foto) : null,
      is_available: true,
      is_visible: true,
      position: pi,
    };
  }),
}));

export function demoDaily(date: string): DailyItem[] {
  const items: [string, string, number, DailyItem['image_path'], boolean][] = [
    ['Pollo al horno con papas', 'Cuarto de pollo con papas y batatas.', 8900, fotoMuestra('pollo-horno'), true],
    ['Tallarines con tuco', 'Pasta casera con salsa de carne.', 7900, fotoMuestra('tallarines'), true],
    ['Guiso de lentejas', 'Con chorizo colorado y panceta.', 7500, fotoMuestra('guiso'), false],
  ];
  return items.map(([name, description, price, image_path, is_available], i) => ({
    id: `demo-daily-${i}`,
    menu_date: date,
    name,
    description,
    price,
    price_cash: efectivoMuestra(price),
    image_path,
    is_available,
    position: i,
  }));
}

/**
 * Variantes del modo demo para revisar estados sin tocar la base: /?demo=cerrado,
 * /?demo=sin-menu, /?demo=abierto (abierto a cualquier hora). Se pueden combinar con coma.
 * Solo existen en modo demo: con Supabase configurado se ignoran.
 */
export function demoVariant(raw: string | undefined, today: string) {
  const flags = new Set((raw ?? '').split(',').map((s) => s.trim()));
  return {
    settings: flags.has('cerrado')
      ? { ...demoSettings, closed_until: today, closed_message: 'Hoy cerramos por inventario. Mañana atendemos normal.' }
      : demoSettings,
    hours: flags.has('abierto')
      ? demoHours.map((h) => ({ ...h, is_open: true, opens_at: '00:00', closes_at: '23:59' }))
      : demoHours,
    daily: flags.has('sin-menu') ? [] : demoDaily(today),
  };
}
