'use client';

import { useId, useState } from 'react';
import { closeStore, reopenStore } from '@/app/admin/actions';
import { StatusBar } from '@/components/menu/StatusBar';
import { addDays, formatShortDate } from '@/lib/hours';
import type { OpeningHour, StoreStatus } from '@/lib/types';
import { useActionRunner } from './useActionRunner';

type Props = {
  status: StoreStatus;
  hours: OpeningHour[];
  closedUntil: string | null;
  closedMessage: string | null;
  today: string;
};

/** Estado actual + cierre manual (feriados, vacaciones). Se vence solo al pasar la fecha. */
export function ClosureCard({ status, hours, closedUntil, closedMessage, today }: Props) {
  const id = useId();
  const { run, pending, toast } = useActionRunner();
  const [until, setUntil] = useState(addDays(today, 1));
  const [message, setMessage] = useState('');
  const manual = Boolean(closedUntil && closedUntil >= today);

  return (
    <div className="panel closure">
      <p className="field__label" style={{ marginTop: 0, marginBottom: '0.625rem' }}>
        Así se ve ahora en el menú
      </p>
      <StatusBar initial={status} hours={hours} closedUntil={closedUntil} closedMessage={closedMessage} />

      {manual && closedUntil ? (
        <div className="closure__actions">
          <p className="admin-lead">
            {closedUntil === today
              ? 'Marcaste el local como cerrado por hoy. Mañana vuelve solo a su horario normal.'
              : `Marcaste el local como cerrado hasta el ${formatShortDate(closedUntil)}, inclusive.`}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={pending}
            onClick={() => run(() => reopenStore())}
          >
            Volver al horario normal
          </button>
        </div>
      ) : (
        <div className="closure__actions">
          <button
            type="button"
            className="btn btn--dark btn--block"
            disabled={pending}
            onClick={() => {
              if (window.confirm('¿Mostrar el local como CERRADO por hoy?')) {
                run(() => closeStore({ until: today, message: '' }));
              }
            }}
          >
            Cerrar por hoy
          </button>

          <details>
            <summary>Cerrar varios días (feriados, vacaciones)</summary>
            <div className="form-grid">
              <label className="field" htmlFor={`${id}-until`}>
                <span className="field__label">Cerrado hasta el día</span>
                <input
                  id={`${id}-until`}
                  type="date"
                  className="input"
                  min={today}
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
                <span className="field__hint">Ese día también figura cerrado. Al otro día vuelve solo.</span>
              </label>
              <label className="field" htmlFor={`${id}-msg`}>
                <span className="field__label">Mensaje para los clientes (opcional)</span>
                <textarea
                  id={`${id}-msg`}
                  className="input"
                  maxLength={160}
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <span className="field__hint">Por ejemplo: Cerramos por vacaciones. Volvemos el lunes 3.</span>
              </label>
              <button
                type="button"
                className="btn btn--dark"
                disabled={pending || !until}
                onClick={() => run(() => closeStore({ until, message }))}
              >
                Cerrar hasta esa fecha
              </button>
            </div>
          </details>
        </div>
      )}

      {toast}
    </div>
  );
}
