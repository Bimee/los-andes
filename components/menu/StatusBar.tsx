'use client';

import { type LiveStatusInput, useLiveStatus } from './useLiveStatus';

/** Estado abierto/cerrado en grande, con el detalle y el mensaje del cierre. Lo usa el panel. */
export function StatusBar(props: LiveStatusInput) {
  const status = useLiveStatus(props);

  return (
    <div className={`status ${status.isOpen ? 'status--open' : 'status--closed'}`} role="status">
      <span className="status__dot" aria-hidden="true" />
      <p className="status__headline">{status.headline}</p>
      <p className="status__detail">{status.detail}</p>
      {status.note ? <p className="status__note">{status.note}</p> : null}
    </div>
  );
}
