'use client';

import { useState, useTransition } from 'react';
import { discardUpload, setCategoryImage } from '@/app/admin/actions';
import { PhotoField } from './PhotoField';
import { NETWORK_ERROR } from './useActionRunner';

type Props = {
  categoryId: string;
  name: string;
  value: string | null;
  onMessage: (text: string, tone?: 'ok' | 'error') => void;
};

/** Foto de la tarjeta de la categoría. Se guarda apenas termina de subir: no hay botón Guardar. */
export function CategoryPhoto({ categoryId, name, value, onMessage }: Props) {
  const [current, setCurrent] = useState(value);
  const [synced, setSynced] = useState(value);
  const [pending, startTransition] = useTransition();

  // Cuando el servidor manda la foto nueva (después de guardar), se actualiza sola
  if (value !== synced) {
    setSynced(value);
    setCurrent(value);
  }

  function save(path: string | null, uploaded?: boolean) {
    if (path === null && !window.confirm(`¿Quitar la foto de ${name}?`)) return;
    const previous = current;
    setCurrent(path);

    startTransition(async () => {
      let error: string | null = null;
      try {
        const result = await setCategoryImage(categoryId, path);
        if (result.ok) onMessage(result.message ?? 'Foto guardada');
        else error = result.error;
      } catch {
        error = NETWORK_ERROR;
      }
      if (error) {
        setCurrent(previous);
        onMessage(error, 'error');
        // La foto recién subida no quedó en ningún lado: se borra del Storage
        if (uploaded && path) void discardUpload(path).catch(() => {});
      }
    });
  }

  return (
    <PhotoField
      label="Foto de la categoría"
      alt={`Foto de ${name}`}
      hint={pending ? 'Guardando…' : 'Se ve en la grilla de la carta. Mejor una foto apaisada y bien de cerca.'}
      value={current}
      disabled={pending}
      onChange={save}
    />
  );
}
