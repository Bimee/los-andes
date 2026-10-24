'use client';

import { type FormEvent, useState } from 'react';
import { saveHours } from '@/app/admin/actions';
import { formatTime, WEEKDAYS } from '@/lib/hours';
import type { OpeningHour } from '@/lib/types';
import { useActionRunner } from './useActionRunner';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // de lunes a domingo

export function HoursForm({ hours }: { hours: OpeningHour[] }) {
  const { run, pending, toast } = useActionRunner();
  const [rows, setRows] = useState<OpeningHour[]>(() =>
    ORDER.map((weekday) => {
      const found = hours.find((h) => h.weekday === weekday);
      return {
        weekday,
        is_open: found?.is_open ?? false,
        opens_at: formatTime(found?.opens_at ?? '10:00'),
        closes_at: formatTime(found?.closes_at ?? '15:30'),
      };
    }),
  );

  const update = (weekday: number, patch: Partial<OpeningHour>) =>
    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => saveHours(rows));
  }

  return (
    <form className="panel" onSubmit={handleSubmit} noValidate>
      {rows.map((row) => {
        const day = WEEKDAYS[row.weekday];
        const label = day[0].toUpperCase() + day.slice(1);
        return (
          <div key={row.weekday} className="hours-row">
            <span className="field__label">{label}</span>
            <label className="check">
              <input
                type="checkbox"
                checked={row.is_open}
                onChange={(e) => update(row.weekday, { is_open: e.target.checked })}
              />
              Abre
            </label>
            {row.is_open ? (
              <div className="hours-row__times">
                <input
                  type="time"
                  className="input"
                  aria-label={`${label}: abre a las`}
                  value={row.opens_at}
                  onChange={(e) => update(row.weekday, { opens_at: e.target.value })}
                />
                <span>a</span>
                <input
                  type="time"
                  className="input"
                  aria-label={`${label}: cierra a las`}
                  value={row.closes_at}
                  onChange={(e) => update(row.weekday, { closes_at: e.target.value })}
                />
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar horarios'}
        </button>
      </div>
      {toast}
    </form>
  );
}
