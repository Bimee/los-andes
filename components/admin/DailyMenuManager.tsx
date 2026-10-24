'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  copyDailyMenu,
  deleteDailyItem,
  moveDailyItem,
  saveDailyItem,
  setDailyItemAvailable,
} from '@/app/admin/actions';
import { addDays, formatLongDate, formatShortDate } from '@/lib/hours';
import type { DailyItem } from '@/lib/types';
import { DishForm } from './DishForm';
import { ItemSummary } from './ItemSummary';
import { useActionRunner } from './useActionRunner';

type Props = {
  date: string;
  today: string;
  items: DailyItem[];
  /** Último día anterior con platos cargados, para ofrecer copiarlo. */
  copySource: string | null;
};

export function DailyMenuManager({ date, today, items, copySource }: Props) {
  const router = useRouter();
  const { run, pending, show, toast } = useActionRunner();
  const [editing, setEditing] = useState<string | null>(null); // id del plato o 'new'
  const tomorrow = addDays(today, 1);

  const when =
    date === today
      ? 'Esto es lo que se ve hoy en el menú.'
      : date === tomorrow
        ? 'Lo que cargues acá aparece mañana a la mañana.'
        : date < today
          ? 'Este día ya pasó. Lo podés usar para copiar platos.'
          : `Lo que cargues acá aparece el ${formatShortDate(date)}.`;

  return (
    <>
      <div className="date-switch">
        <Link className={date === today ? 'btn btn--dark' : 'btn'} href="/admin/menu-del-dia">
          Hoy
        </Link>
        <Link
          className={date === tomorrow ? 'btn btn--dark' : 'btn'}
          href={`/admin/menu-del-dia?fecha=${tomorrow}`}
        >
          Mañana
        </Link>
        <label className="field">
          <span className="field__label">Otro día</span>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => {
              if (e.target.value) router.push(`/admin/menu-del-dia?fecha=${e.target.value}`);
            }}
          />
        </label>
      </div>

      <h2 className="date-heading">
        {formatLongDate(date)}
        <small>{when}</small>
      </h2>

      {items.length === 0 ? (
        <p className="empty-state">Todavía no hay platos cargados para este día.</p>
      ) : (
        <ul className="item-list">
          {items.map((item, index) =>
            editing === item.id ? (
              <li key={item.id} className="item">
                <DishForm
                  initial={item}
                  submitLabel="Guardar cambios"
                  onSubmit={(values) => saveDailyItem(date, { ...values, id: item.id })}
                  onSaved={(message) => message && show(message)}
                  onClose={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={item.id} className={item.is_available ? 'item' : 'item item--muted'}>
                <ItemSummary {...item} />
                <div className="item__actions">
                  <button type="button" className="btn btn--sm" onClick={() => setEditing(item.id)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={pending}
                    onClick={() => run(() => setDailyItemAvailable(item.id, !item.is_available))}
                  >
                    {item.is_available ? 'Marcar agotado' : 'Hay de nuevo'}
                  </button>
                  <span className="item__break" aria-hidden="true" />
                  <button
                    type="button"
                    className="btn btn--sm btn--icon"
                    aria-label={`Subir ${item.name}`}
                    disabled={pending || index === 0}
                    onClick={() => run(() => moveDailyItem(item.id, 'up'))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--icon"
                    aria-label={`Bajar ${item.name}`}
                    disabled={pending || index === items.length - 1}
                    onClick={() => run(() => moveDailyItem(item.id, 'down'))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`¿Borrar "${item.name}" del menú de este día?`)) {
                        run(() => deleteDailyItem(item.id));
                      }
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <div className="admin-section">
        {editing === 'new' ? (
          <div className="panel">
            <h3 className="admin-section__title">Plato nuevo</h3>
            <DishForm
              submitLabel="Agregar al menú"
              onSubmit={(values) => saveDailyItem(date, values)}
              onSaved={(message) => message && show(message)}
              onClose={() => setEditing(null)}
            />
          </div>
        ) : (
          <button type="button" className="btn btn--primary btn--block" onClick={() => setEditing('new')}>
            Agregar plato
          </button>
        )}
      </div>

      {items.length === 0 && copySource ? (
        <div className="panel admin-section">
          <p className="admin-section__title">¿Se repiten platos?</p>
          <p className="admin-lead">
            Copiá el menú del {formatShortDate(copySource)} y después cambiá lo que haga falta.
          </p>
          <button
            type="button"
            className="btn btn--dark btn--block"
            disabled={pending}
            onClick={() => run(() => copyDailyMenu(copySource, date))}
          >
            Copiar el menú del {formatShortDate(copySource)}
          </button>
        </div>
      ) : null}

      {toast}
    </>
  );
}
