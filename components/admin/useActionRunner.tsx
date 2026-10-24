'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { ActionResult } from '@/lib/types';

type Notice = { text: string; tone: 'ok' | 'error'; key: number };

const NETWORK_ERROR = 'No se pudo conectar. Revisá internet y probá de nuevo.';

/**
 * Ejecuta una Server Action y muestra un aviso abajo ("Guardado", o el error).
 * Devuelve el nodo `toast` para renderizar una vez en el componente.
 */
export function useActionRunner() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 7000 : 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const show = useCallback((text: string, tone: Notice['tone'] = 'ok') => {
    setNotice({ text, tone, key: Date.now() });
  }, []);

  const run = useCallback(
    (action: () => Promise<ActionResult>, onSuccess?: () => void) => {
      startTransition(async () => {
        try {
          const result = await action();
          if (result.ok) {
            if (result.message) show(result.message);
            onSuccess?.();
          } else {
            show(result.error, 'error');
          }
        } catch {
          show(NETWORK_ERROR, 'error');
        }
      });
    },
    [show],
  );

  const toast = (
    <div className="toast-region" aria-live="polite">
      {notice ? (
        <p key={notice.key} className={notice.tone === 'error' ? 'toast toast--error' : 'toast'}>
          {notice.text}
        </p>
      ) : null}
    </div>
  );

  return { run, pending, show, toast };
}

export { NETWORK_ERROR };
