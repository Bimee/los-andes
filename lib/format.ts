const ars0 = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ars2 = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 9500 → "$ 9.500" · 9500.5 → "$ 9.500,50" · null → null */
export function formatPrice(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return (Number.isInteger(n) ? ars0 : ars2).format(n);
}

/**
 * Interpreta lo que escribe una persona en el campo precio.
 * Acepta: "9500", "9.500", "$ 9.500", "9.500,50", "9500,5", "9500.50".
 * Devuelve null si está vacío y NaN si no se entiende.
 */
export function parsePrice(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  let s = input.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (s === '') return null;

  if (s.includes(',')) {
    // Formato argentino: punto de miles, coma decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "9.500" o "1.250.000": puntos de miles
    s = s.replace(/\./g, '');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100) / 100;
}

/** Número para mostrar dentro de un input: 9500 → "9500", 9500.5 → "9500,50" */
export function priceToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappHref(number: string, text?: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Abre la dirección en Google Maps (app o web). */
export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Limpia espacios repetidos y recorta. Devuelve null si queda vacío. */
export function cleanText(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, ' ').trim().slice(0, max);
  return s === '' ? null : s;
}
