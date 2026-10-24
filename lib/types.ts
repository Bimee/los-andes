export type Settings = {
  business_name: string;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  closed_until: string | null; // YYYY-MM-DD
  closed_message: string | null;
};

export type OpeningHour = {
  weekday: number; // 0 = domingo … 6 = sábado
  is_open: boolean;
  opens_at: string; // HH:MM o HH:MM:SS
  closes_at: string;
};

export type Category = {
  id: string;
  name: string;
  /** Se genera desde el nombre al crear la categoría y no cambia: es la URL /carta/[slug]. */
  slug: string;
  image_path: string | null;
  position: number;
  is_visible: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  /** Precio pagando en efectivo o por transferencia. null = se muestra un solo precio. */
  price_cash: number | null;
  image_path: string | null;
  is_available: boolean;
  is_visible: boolean;
  position: number;
};

export type DailyItem = {
  id: string;
  menu_date: string; // YYYY-MM-DD
  name: string;
  description: string | null;
  price: number | null;
  price_cash: number | null;
  image_path: string | null;
  is_available: boolean;
  position: number;
};

export type CategoryWithProducts = Category & { products: Product[] };

export type StoreStatus = {
  isOpen: boolean;
  /** true si el cierre viene del botón "Cerrar" del panel (feriado, vacaciones). */
  manual: boolean;
  headline: string;
  detail: string;
  /** Versión de una línea para el encabezado: "Abierto · cierra 15:30". */
  short: string;
  note?: string;
};

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Lo que manda el formulario de un plato (carta o menú del día). */
export type DishInput = {
  id?: string;
  name: string;
  description?: string | null;
  price?: number | null;
  price_cash?: number | null;
  image_path?: string | null;
  is_available?: boolean;
};
