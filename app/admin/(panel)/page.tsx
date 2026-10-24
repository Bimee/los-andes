import Link from 'next/link';
import { ClosureCard } from '@/components/admin/ClosureCard';
import { getCarta, getDailyItems, getHours, getSettings } from '@/lib/admin-data';
import { requireStaff } from '@/lib/auth';
import { formatLongDate, getStoreStatus, todayIso } from '@/lib/hours';

export default async function AdminHomePage() {
  const db = await requireStaff();
  const today = todayIso();
  const [settings, hours, daily, carta] = await Promise.all([
    getSettings(db),
    getHours(db),
    getDailyItems(db, today),
    getCarta(db),
  ]);

  const status = getStoreStatus({
    hours,
    closedUntil: settings.closed_until,
    closedMessage: settings.closed_message,
  });
  const products = carta.flatMap((c) => c.products);
  const soldOut = products.filter((p) => !p.is_available).length;

  const dailyMeta =
    daily.length === 0
      ? 'Todavía no cargaste el menú de hoy'
      : daily.length === 1
        ? 'Hoy hay 1 plato cargado'
        : `Hoy hay ${daily.length} platos cargados`;

  const cartaMeta = [
    `${products.length} ${products.length === 1 ? 'plato' : 'platos'} en ${carta.length} ${carta.length === 1 ? 'categoría' : 'categorías'}`,
    soldOut > 0 ? `${soldOut} ${soldOut === 1 ? 'agotado' : 'agotados'}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <h1 className="admin-title">Hola</h1>
      <p className="admin-lead">{formatLongDate(today)}. ¿Qué querés actualizar?</p>

      <Link className="tile tile--main" href="/admin/menu-del-dia">
        <span className="tile__title">Menú del día</span>
        <span className="tile__meta">{dailyMeta}</span>
      </Link>

      <section className="admin-section" aria-labelledby="estado-title">
        <h2 className="admin-section__title" id="estado-title">
          Abierto o cerrado
        </h2>
        <ClosureCard
          status={status}
          hours={hours}
          closedUntil={settings.closed_until}
          closedMessage={settings.closed_message}
          today={today}
        />
      </section>

      <section className="admin-section" aria-labelledby="mas-title">
        <h2 className="admin-section__title" id="mas-title">
          Más opciones
        </h2>
        <div className="tiles">
          <Link className="tile" href="/admin/carta">
            <span className="tile__title">Carta</span>
            <span className="tile__meta">{cartaMeta}</span>
          </Link>
          <Link className="tile" href="/admin/precios">
            <span className="tile__title">Precios</span>
            <span className="tile__meta">Cambiá varios precios a la vez</span>
          </Link>
          <Link className="tile" href="/admin/ajustes">
            <span className="tile__title">Horarios y datos</span>
            <span className="tile__meta">Teléfono, WhatsApp, dirección y horarios</span>
          </Link>
          <Link className="tile" href="/admin/qr">
            <span className="tile__title">Código QR</span>
            <span className="tile__meta">Para imprimir y pegar en el local</span>
          </Link>
        </div>
      </section>
    </>
  );
}
