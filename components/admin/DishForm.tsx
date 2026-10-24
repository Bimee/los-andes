'use client';

import { type FormEvent, useId, useRef, useState, useTransition } from 'react';
import { discardUpload } from '@/app/admin/actions';
import { parsePrice, priceToInput } from '@/lib/format';
import type { ActionResult } from '@/lib/types';
import { PhotoField } from './PhotoField';
import { NETWORK_ERROR } from './useActionRunner';

export type DishFormValues = {
  name: string;
  description: string | null;
  price: number | null;
  price_cash: number | null;
  image_path: string | null;
  is_available: boolean;
  category_id?: string;
};

type Props = {
  initial?: Partial<DishFormValues>;
  categories?: { id: string; name: string }[];
  submitLabel: string;
  onSubmit: (values: DishFormValues) => Promise<ActionResult>;
  onSaved?: (message?: string) => void;
  onClose: () => void;
};

/** Formulario de un plato: lo usan el menú del día y la carta. */
export function DishForm({ initial, categories, submitLabel, onSubmit, onSaved, onClose }: Props) {
  const id = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(priceToInput(initial?.price));
  const [priceCash, setPriceCash] = useState(priceToInput(initial?.price_cash));
  const [image, setImage] = useState<string | null>(initial?.image_path ?? null);
  const [available, setAvailable] = useState(initial?.is_available ?? true);
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories?.[0]?.id ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Fotos subidas en este formulario: si no se usan, se borran del Storage
  const uploads = useRef<string[]>([]);
  const initialImage = initial?.image_path ?? null;

  function discardUnused(keep: string | null) {
    for (const path of uploads.current) {
      if (path !== keep && path !== initialImage) void discardUpload(path).catch(() => {});
    }
    uploads.current = [];
  }

  function handleCancel() {
    discardUnused(null);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Escribí el nombre del plato.');
      return;
    }
    const parsedPrice = parsePrice(price);
    if (Number.isNaN(parsedPrice)) {
      setError('Escribí el precio solo con números. Por ejemplo: 9500');
      return;
    }
    const parsedCash = parsePrice(priceCash);
    if (Number.isNaN(parsedCash)) {
      setError('Escribí el precio en efectivo solo con números. Por ejemplo: 8500');
      return;
    }
    if (categories && !categoryId) {
      setError('Elegí una categoría.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await onSubmit({
          name,
          description: description || null,
          price: parsedPrice,
          price_cash: parsedCash,
          image_path: image,
          is_available: available,
          category_id: categories ? categoryId : undefined,
        });
        if (result.ok) {
          discardUnused(image);
          onSaved?.(result.message);
          onClose();
        } else {
          setError(result.error);
        }
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <label className="field" htmlFor={`${id}-name`}>
        <span className="field__label">Nombre del plato</span>
        <input
          id={`${id}-name`}
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="off"
          required
        />
      </label>

      <label className="field" htmlFor={`${id}-desc`}>
        <span className="field__label">Descripción (opcional)</span>
        <textarea
          id={`${id}-desc`}
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={240}
          rows={2}
        />
        <span className="field__hint">Por ejemplo: con papas fritas o puré.</span>
      </label>

      <div className="price-pair">
        <label className="field" htmlFor={`${id}-price`}>
          <span className="field__label">Precio</span>
          <span className="price-input">
            <input
              id={`${id}-price`}
              className="input input--price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          </span>
        </label>
        <label className="field" htmlFor={`${id}-cash`}>
          <span className="field__label">Efectivo o transferencia</span>
          <span className="price-input">
            <input
              id={`${id}-cash`}
              className="input input--price"
              value={priceCash}
              onChange={(e) => setPriceCash(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          </span>
        </label>
        <span className="field__hint price-pair__hint">
          Solo números, por ejemplo 9500. Si dejás vacío el de efectivo, se muestra un solo precio. Si dejás los dos
          vacíos, no se muestra precio.
        </span>
      </div>

      {categories ? (
        <label className="field" htmlFor={`${id}-cat`}>
          <span className="field__label">Categoría</span>
          <select
            id={`${id}-cat`}
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <PhotoField
        value={image}
        onChange={(path, uploaded) => {
          if (path && uploaded) uploads.current.push(path);
          setImage(path);
        }}
        onBusyChange={setUploading}
      />

      <label className="check">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        Hay para vender (desmarcalo si se agotó)
      </label>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={pending || uploading}>
          {pending ? 'Guardando…' : submitLabel}
        </button>
        <button type="button" className="btn" onClick={handleCancel} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
