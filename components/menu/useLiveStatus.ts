'use client';

import { useEffect, useState } from 'react';
import { getStoreStatus } from '@/lib/hours';
import type { OpeningHour, StoreStatus } from '@/lib/types';

export type LiveStatusInput = {
  initial: StoreStatus;
  hours: OpeningHour[];
  closedUntil: string | null;
  closedMessage: string | null;
};

/**
 * Estado abierto/cerrado que se recalcula solo. Arranca con lo que calculó el
 * servidor (sin saltos al hidratar): si alguien deja la página abierta, a las
 * 15:30 pasa a "Cerrado" sin recargar.
 */
export function useLiveStatus({ initial, hours, closedUntil, closedMessage }: LiveStatusInput): StoreStatus {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    const update = () => setStatus(getStoreStatus({ hours, closedUntil, closedMessage }));
    update();
    const timer = window.setInterval(update, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [hours, closedUntil, closedMessage]);

  return status;
}
