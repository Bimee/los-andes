'use client';

import { type LiveStatusInput, useLiveStatus } from './useLiveStatus';

/** "Abierto · cierra 15:30" en una línea. Lleva a los horarios del pie. */
export function StatusLine(props: LiveStatusInput) {
  const status = useLiveStatus(props);

  return (
    <a className={`status-line ${status.isOpen ? 'status-line--open' : 'status-line--closed'}`} href="#pedidos">
      <span className="status-line__dot" aria-hidden="true" />
      <span className="status-line__text">{status.short}</span>
      <span className="status-line__more">Horarios</span>
    </a>
  );
}
