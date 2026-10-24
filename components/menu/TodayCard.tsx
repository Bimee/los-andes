import Link from 'next/link';
import { formatLongDate, weekdayOf } from '@/lib/hours';
import type { DailyItem, OpeningHour, StoreStatus } from '@/lib/types';
import { ArrowRightIcon } from './icons';

const MAX_NAMES = 4;

type Props = {
  daily: DailyItem[];
  today: string;
  status: StoreStatus;
  hours: OpeningHour[];
  /** Si hay WhatsApp cargado, el aviso de "todavía no está cargado" lo sugiere. */
  hasContact: boolean;
};

/**
 * El menú del día como tarjeta destacada (superficie oscura) arriba de la carta:
 * fecha y hasta 4 platos. Tocarla lleva a /menu-del-dia con precios y detalle.
 */
export function TodayCard({ daily, today, status, hours, hasContact }: Props) {
  const dishes = visibleDaily(daily, status);

  if (dishes.length === 0) {
    const [message, sub] = dailyEmptyText(status, hours, today, hasContact);
    return (
      <section className="today today--empty" aria-labelledby="today-title">
        <h2 className="today__kicker" id="today-title">
          Menú del día
        </h2>
        <p className="today__date">{formatLongDate(today)}</p>
        <p className="today__msg">{message}</p>
        <p className="today__sub">{sub}</p>
        {status.manual && status.note ? <p className="today__note">{status.note}</p> : null}
      </section>
    );
  }

  const shown = dishes.slice(0, MAX_NAMES);
  const extra = dishes.length - shown.length;

  return (
    <section className="today" aria-labelledby="today-title">
      <h2 className="today__kicker" id="today-title">
        Menú del día
      </h2>
      <p className="today__date">{formatLongDate(today)}</p>
      <ul className="today__list">
        {shown.map((dish) => (
          <li key={dish.id}>
            {dish.name}
            {dish.is_available ? null : <span className="today__out"> · agotado</span>}
          </li>
        ))}
      </ul>
      {extra > 0 ? <p className="today__extra">y {extra === 1 ? '1 plato más' : `${extra} platos más`}</p> : null}
      <Link className="today__cta" href="/menu-del-dia">
        Ver precios y detalle
        <ArrowRightIcon />
      </Link>
    </section>
  );
}

/** Con el local cerrado a mano (feriado, vacaciones) no se muestra el menú del día aunque esté cargado. */
export function visibleDaily(daily: DailyItem[], status: StoreStatus): DailyItem[] {
  return status.manual ? [] : daily;
}

/** Qué decir cuando no hay platos del día para mostrar. */
export function dailyEmptyText(
  status: StoreStatus,
  hours: OpeningHour[],
  today: string,
  hasContact: boolean,
): [string, string] {
  if (status.manual) return [`${status.headline}.`, `${status.detail}.`];
  const todayHours = hours.find((h) => h.weekday === weekdayOf(today));
  if (!todayHours?.is_open) return ['Hoy no hay menú del día.', `${status.detail}.`];
  if (status.isOpen) {
    return [
      'El menú de hoy todavía no está cargado.',
      hasContact ? 'Consultalo por WhatsApp.' : 'Volvé a mirar en un rato.',
    ];
  }
  if (status.detail.startsWith('Abre hoy')) return ['El menú de hoy todavía no está cargado.', `${status.detail}.`];
  return ['Ya cerramos por hoy.', `${status.detail}.`];
}
