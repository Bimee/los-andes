import { TIMEZONE } from './config';
import type { OpeningHour, StoreStatus } from './types';

export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const SHORT_TO_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export type ZonedNow = {
  isoDate: string; // YYYY-MM-DD en hora de Córdoba
  weekday: number; // 0 = domingo
  minutes: number; // minutos desde las 00:00
};

/**
 * "Ahora" en la hora del local. El servidor (Vercel) corre en UTC,
 * así que nunca usamos getHours()/getDay() directo.
 */
export function zonedNow(date: Date = new Date()): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = Number(get('hour')) % 24;
  return {
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: SHORT_TO_INDEX[get('weekday')] ?? 0,
    minutes: hour * 60 + Number(get('minute')),
  };
}

export function todayIso(): string {
  return zonedNow().isoDate;
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function isoToDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string): number {
  return isoToDate(iso).getUTCDay();
}

/** "2026-10-21" → "Miércoles 21 de octubre" */
export function formatLongDate(iso: string): string {
  const d = isoToDate(iso);
  const day = WEEKDAYS[d.getUTCDay()];
  return `${day[0].toUpperCase()}${day.slice(1)} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}

/** "2026-10-21" → "miércoles 21/10" */
export function formatShortDate(iso: string): string {
  const d = isoToDate(iso);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** "10:00:00" → "10:00" */
export function formatTime(time: string): string {
  const [h = '00', m = '00'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Próxima apertura a partir de mañana, salteando los días de cierre manual.
 * detail: "Abre mañana a las 10:00" · short: "abre mañana 10:00"
 */
function nextOpening(
  byDay: Map<number, OpeningHour>,
  fromIso: string,
  closedUntil: string | null,
): { detail: string; short: string } | null {
  for (let i = 1; i <= 21; i++) {
    const date = addDays(fromIso, i);
    if (closedUntil && date <= closedUntil) continue;
    const wd = weekdayOf(date);
    const h = byDay.get(wd);
    if (!h?.is_open) continue;
    const time = formatTime(h.opens_at);
    if (i === 1) return { detail: `Abre mañana a las ${time}`, short: `abre mañana ${time}` };
    if (i < 7) return { detail: `Abre el ${WEEKDAYS[wd]} a las ${time}`, short: `abre el ${WEEKDAYS[wd]} ${time}` };
    return { detail: `Abre el ${formatShortDate(date)} a las ${time}`, short: `abre el ${formatShortDate(date)}` };
  }
  return null;
}

export function getStoreStatus(input: {
  hours: OpeningHour[];
  closedUntil: string | null;
  closedMessage: string | null;
  now?: Date;
}): StoreStatus {
  const { hours, closedUntil, closedMessage } = input;
  const z = zonedNow(input.now);
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  const manualToday = Boolean(closedUntil && closedUntil >= z.isoDate);
  const today = byDay.get(z.weekday);

  if (!manualToday && today?.is_open) {
    const opens = toMinutes(today.opens_at);
    const closes = toMinutes(today.closes_at);
    if (z.minutes >= opens && z.minutes < closes) {
      return {
        isOpen: true,
        manual: false,
        headline: 'Abierto ahora',
        detail: `Cierra a las ${formatTime(today.closes_at)}`,
        short: `Abierto · cierra ${formatTime(today.closes_at)}`,
      };
    }
    if (z.minutes < opens) {
      return {
        isOpen: false,
        manual: false,
        headline: 'Cerrado ahora',
        detail: `Abre hoy a las ${formatTime(today.opens_at)}`,
        short: `Cerrado · abre hoy ${formatTime(today.opens_at)}`,
      };
    }
  }

  const next = nextOpening(byDay, z.isoDate, closedUntil);
  const short = next ? `Cerrado · ${next.short}` : 'Cerrado';

  if (manualToday && closedUntil) {
    const headline =
      closedUntil === z.isoDate ? 'Hoy está cerrado' : `Cerrado hasta el ${formatShortDate(closedUntil)}`;
    return {
      isOpen: false,
      manual: true,
      headline: capitalize(headline),
      detail: next?.detail ?? 'Consultá por teléfono',
      short,
      note: closedMessage?.trim() || undefined,
    };
  }

  return {
    isOpen: false,
    manual: false,
    headline: 'Cerrado ahora',
    detail: next?.detail ?? 'Consultá por teléfono',
    short,
  };
}

/**
 * Agrupa días consecutivos con el mismo horario para el pie del menú:
 * [{ label: "Lunes a sábado", value: "10:00 a 15:30" }, { label: "Domingo", value: "Cerrado" }]
 */
export function summarizeHours(hours: OpeningHour[]): { label: string; value: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0]; // la semana arranca el lunes
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  const keyOf = (h?: OpeningHour) =>
    h?.is_open ? `${formatTime(h.opens_at)} a ${formatTime(h.closes_at)}` : 'Cerrado';

  const groups: { days: number[]; value: string }[] = [];
  for (const wd of order) {
    const value = keyOf(byDay.get(wd));
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.days.push(wd);
    else groups.push({ days: [wd], value });
  }

  return groups.map(({ days, value }) => {
    const first = capitalize(WEEKDAYS[days[0]]);
    const lastDay = WEEKDAYS[days[days.length - 1]];
    const label =
      days.length === 1 ? first : days.length === 2 ? `${first} y ${lastDay}` : `${first} a ${lastDay}`;
    return { label, value };
  });
}
