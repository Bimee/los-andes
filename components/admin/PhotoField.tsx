'use client';

import { useId, useState } from 'react';
import { IMAGE_BUCKET, imageUrl } from '@/lib/config';
import { compressImage } from '@/lib/image';
import { createClient } from '@/lib/supabase/client';

type Props = {
  value: string | null;
  onChange: (path: string | null, uploaded?: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  label?: string;
  /** Texto alternativo de la vista previa. */
  alt?: string;
  hint?: string;
  /** Deshabilita los botones mientras se guarda afuera (por ejemplo la foto de una categoría). */
  disabled?: boolean;
};

/** Elegir foto (cámara o galería), comprimirla en el celular y subirla a Storage. */
export function PhotoField({
  value,
  onChange,
  onBusyChange,
  label = 'Foto (opcional)',
  alt = 'Foto del plato',
  hint,
  disabled = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const src = imageUrl(value);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    onBusyChange?.(true);
    try {
      const { blob, ext } = await compressImage(file);
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await createClient()
        .storage.from(IMAGE_BUCKET)
        .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
      if (uploadError) throw uploadError;
      onChange(path, true);
    } catch {
      setError('No se pudo subir la foto. Probá con otra o revisá la conexión.');
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="photo-field">
        <div className="photo-field__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt={alt} /> : 'Sin foto'}
        </div>
        <div className="btn-row">
          <label className="btn btn--soft photo-field__pick" htmlFor={inputId} aria-disabled={disabled || undefined}>
            {uploading ? 'Subiendo foto…' : src ? 'Cambiar foto' : 'Agregar foto'}
            <input
              id={inputId}
              type="file"
              accept="image/*"
              disabled={uploading || disabled}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void handleFile(file);
              }}
            />
          </label>
          {src && !uploading ? (
            <button type="button" className="btn btn--soft" disabled={disabled} onClick={() => onChange(null)}>
              Quitar foto
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
