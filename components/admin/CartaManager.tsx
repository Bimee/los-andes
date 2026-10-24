'use client';

import { type FormEvent, useState } from 'react';
import {
  deleteCategory,
  deleteProduct,
  moveCategory,
  moveProduct,
  saveCategory,
  saveProduct,
  setCategoryVisible,
  setProductAvailable,
  setProductVisible,
} from '@/app/admin/actions';
import { imageUrl } from '@/lib/config';
import type { CategoryWithProducts } from '@/lib/types';
import { CategoryPhoto } from './CategoryPhoto';
import { DishForm } from './DishForm';
import { ItemSummary } from './ItemSummary';
import { useActionRunner } from './useActionRunner';

type Props = { categories: CategoryWithProducts[] };

export function CartaManager({ categories }: Props) {
  const { run, pending, show, toast } = useActionRunner();
  // Qué formulario está abierto: id de plato, `new:<categoría>`, `rename:<categoría>` o 'new-category'
  const [open, setOpen] = useState<string | null>(null);
  const options = categories.map((c) => ({ id: c.id, name: c.name }));
  const close = () => setOpen(null);

  return (
    <>
      {categories.length === 0 ? (
        <p className="empty-state">
          La carta está vacía. Empezá creando una categoría, por ejemplo Minutas o Empanadas.
        </p>
      ) : null}

      {categories.map((cat, catIndex) => {
        const count = cat.products.length;
        const photo = imageUrl(cat.image_path);
        return (
          <details key={cat.id} className="cat-block">
            <summary>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo ? <img className="cat-block__thumb" src={photo} alt="" loading="lazy" /> : null}
              <span className="cat-block__text">
                <span className="cat-block__name">{cat.name}</span>
                <span className="cat-block__count">
                  {count === 1 ? '1 plato' : `${count} platos`}
                  {!cat.is_visible ? ', oculta en el menú' : ''}
                </span>
              </span>
            </summary>

            <div className="cat-block__body">
              {count > 0 ? (
                <ul className="item-list">
                  {cat.products.map((product, index) =>
                    open === product.id ? (
                      <li key={product.id} className="item">
                        <DishForm
                          initial={product}
                          categories={options}
                          submitLabel="Guardar cambios"
                          onSubmit={(values) =>
                            saveProduct({ ...values, id: product.id, category_id: values.category_id ?? cat.id })
                          }
                          onSaved={(message) => message && show(message)}
                          onClose={close}
                        />
                      </li>
                    ) : (
                      <li
                        key={product.id}
                        className={product.is_available && product.is_visible ? 'item' : 'item item--muted'}
                      >
                        <ItemSummary {...product} hidden={!product.is_visible} />
                        <div className="item__actions">
                          <button type="button" className="btn btn--sm" onClick={() => setOpen(product.id)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm"
                            disabled={pending}
                            onClick={() => run(() => setProductAvailable(product.id, !product.is_available))}
                          >
                            {product.is_available ? 'Marcar agotado' : 'Hay de nuevo'}
                          </button>
                          <span className="item__break" aria-hidden="true" />
                          <button
                            type="button"
                            className="btn btn--sm"
                            disabled={pending}
                            onClick={() => run(() => setProductVisible(product.id, !product.is_visible))}
                          >
                            {product.is_visible ? 'Ocultar' : 'Mostrar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--icon"
                            aria-label={`Subir ${product.name}`}
                            disabled={pending || index === 0}
                            onClick={() => run(() => moveProduct(product.id, 'up'))}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--icon"
                            aria-label={`Bajar ${product.name}`}
                            disabled={pending || index === count - 1}
                            onClick={() => run(() => moveProduct(product.id, 'down'))}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm"
                            disabled={pending}
                            onClick={() => {
                              if (window.confirm(`¿Borrar "${product.name}" de la carta? No se puede deshacer.`)) {
                                run(() => deleteProduct(product.id));
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
              ) : (
                <p className="empty-state">Esta categoría todavía no tiene platos.</p>
              )}

              <div className="admin-section">
                {open === `new:${cat.id}` ? (
                  <div className="panel">
                    <h3 className="admin-section__title">Plato nuevo en {cat.name}</h3>
                    <DishForm
                      initial={{ category_id: cat.id }}
                      categories={options}
                      submitLabel="Agregar a la carta"
                      onSubmit={(values) => saveProduct({ ...values, category_id: values.category_id ?? cat.id })}
                      onSaved={(message) => message && show(message)}
                      onClose={close}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary btn--block"
                    onClick={() => setOpen(`new:${cat.id}`)}
                  >
                    Agregar plato en {cat.name}
                  </button>
                )}
              </div>

              <div className="admin-section cat-block__tools">
                <CategoryPhoto categoryId={cat.id} name={cat.name} value={cat.image_path} onMessage={show} />
                <p className="field__label cat-block__tools-title">Opciones de la categoría</p>
                {open === `rename:${cat.id}` ? (
                  <CategoryNameForm
                    initial={cat.name}
                    submitLabel="Guardar nombre"
                    pending={pending}
                    onSubmit={(name) => run(() => saveCategory({ id: cat.id, name }), close)}
                    onCancel={close}
                  />
                ) : (
                  <div className="btn-row">
                    <button type="button" className="btn btn--sm" onClick={() => setOpen(`rename:${cat.id}`)}>
                      Cambiar nombre
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={pending}
                      onClick={() => run(() => setCategoryVisible(cat.id, !cat.is_visible))}
                    >
                      {cat.is_visible ? 'Ocultar del menú' : 'Mostrar en el menú'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--icon"
                      aria-label={`Subir la categoría ${cat.name}`}
                      disabled={pending || catIndex === 0}
                      onClick={() => run(() => moveCategory(cat.id, 'up'))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--icon"
                      aria-label={`Bajar la categoría ${cat.name}`}
                      disabled={pending || catIndex === categories.length - 1}
                      onClick={() => run(() => moveCategory(cat.id, 'down'))}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`¿Borrar la categoría "${cat.name}"?`)) {
                          run(() => deleteCategory(cat.id));
                        }
                      }}
                    >
                      Borrar categoría
                    </button>
                  </div>
                )}
              </div>
            </div>
          </details>
        );
      })}

      <div className="admin-section">
        {open === 'new-category' ? (
          <div className="panel">
            <h3 className="admin-section__title">Categoría nueva</h3>
            <CategoryNameForm
              initial=""
              submitLabel="Crear categoría"
              pending={pending}
              onSubmit={(name) => run(() => saveCategory({ name }), close)}
              onCancel={close}
            />
          </div>
        ) : (
          <button type="button" className="btn btn--dark btn--block" onClick={() => setOpen('new-category')}>
            Agregar categoría
          </button>
        )}
      </div>

      {toast}
    </>
  );
}

function CategoryNameForm(props: {
  initial: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(props.initial);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Escribí el nombre de la categoría.');
      return;
    }
    setError(null);
    props.onSubmit(name);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field__label">Nombre de la categoría</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="off"
          placeholder="Por ejemplo: Empanadas"
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={props.pending}>
          {props.submitLabel}
        </button>
        <button type="button" className="btn" onClick={props.onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
