'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { imageUrl } from '@/lib/config';
import { PriceTag } from './PriceTag';

export type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_cash: number | null;
  image_path: string | null;
  is_available: boolean;
};

type Heading = 'h2' | 'h3';

/** Marca propia en history.state para reconocer la entrada que agrega el detalle abierto. */
const HISTORY_KEY = 'losAndesDetalle';

function historyToken(): unknown {
  return (window.history.state as Record<string, unknown> | null)?.[HISTORY_KEY];
}

/**
 * Lista de platos en tarjetas. Al tocar una se abre el detalle (dialog nativo):
 * hoja inferior en el celular, modal centrado en pantallas grandes.
 * Abrirlo agrega una entrada al historial, así el botón atrás del celular
 * cierra el detalle en vez de salir de la página.
 */
export function DishList({ dishes, heading = 'h2' }: { dishes: Dish[]; heading?: Heading }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tokenRef = useRef<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const dish = openId ? (dishes.find((d) => d.id === openId) ?? null) : null;

  const closeView = useCallback(() => {
    tokenRef.current = null;
    if (dialogRef.current?.open) dialogRef.current.close();
    setOpenId(null);
    triggerRef.current?.focus();
  }, []);

  // Atrás (gesto, botón del celular o del navegador): cierra el detalle
  useEffect(() => {
    const onPopState = () => {
      if (tokenRef.current !== null && historyToken() !== tokenRef.current) closeView();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeView]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dish && dialog && !dialog.open) dialog.showModal();
  }, [dish]);

  function open(id: string, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    const token = Date.now();
    tokenRef.current = token;
    // Misma URL, entrada nueva (Next.js conserva su estado interno en pushState)
    window.history.pushState({ [HISTORY_KEY]: token }, '');
    setOpenId(id);
  }

  /**
   * Botón Cerrar, Escape o tocar el fondo: se cierra en el momento y después se saca
   * la entrada que agregó open(), así un "atrás" posterior no queda muerto.
   * Como el token ya está en null, el popstate de ese back no vuelve a cerrar nada.
   */
  function closeAndPop() {
    const token = tokenRef.current;
    closeView();
    if (token !== null && historyToken() === token) window.history.back();
  }

  return (
    <>
      <ul className="dish-list">
        {dishes.map((d) => (
          <DishCard key={d.id} dish={d} Heading={heading} onOpen={open} />
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="sheet"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          closeAndPop();
        }}
        onClose={() => {
          // Se cerró solo (el navegador no siempre deja frenar el Escape): mismo cierre
          if (tokenRef.current !== null) closeAndPop();
        }}
        onClick={(event) => {
          // Tocar el fondo oscuro también cierra
          if (event.target === event.currentTarget) closeAndPop();
        }}
      >
        {dish ? <DishDetail dish={dish} titleId={titleId} onClose={closeAndPop} /> : null}
      </dialog>
    </>
  );
}

function DishCard({
  dish,
  Heading,
  onOpen,
}: {
  dish: Dish;
  Heading: Heading;
  onOpen: (id: string, trigger: HTMLButtonElement) => void;
}) {
  const src = imageUrl(dish.image_path);
  const className = ['dish-card', src ? 'dish-card--photo' : '', dish.is_available ? '' : 'dish-card--out']
    .filter(Boolean)
    .join(' ');

  return (
    <li className={className}>
      <div className="dish-card__main">
        <div>
          <Heading className="dish-card__name">
            <button
              type="button"
              className="dish-card__open"
              aria-haspopup="dialog"
              onClick={(event) => onOpen(dish.id, event.currentTarget)}
            >
              {dish.name}
            </button>
          </Heading>
          {dish.description ? <p className="dish-card__desc">{dish.description}</p> : null}
        </div>
        {src ? (
          <div className="dish-card__thumb">
            {/* Las fotos ya se suben comprimidas desde el panel: no hace falta next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" width={240} height={240} loading="lazy" decoding="async" />
          </div>
        ) : null}
      </div>
      {dish.is_available ? (
        <PriceTag price={dish.price} cash={dish.price_cash} />
      ) : (
        <p className="dish-card__out">
          <span className="tag">Agotado</span>
          Por hoy no queda.
        </p>
      )}
    </li>
  );
}

function DishDetail({ dish, titleId, onClose }: { dish: Dish; titleId: string; onClose: () => void }) {
  const src = imageUrl(dish.image_path);

  return (
    <div className="sheet__inner">
      <div className="sheet__scroll">
        <span className="sheet__handle" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img className="sheet__photo" src={src} alt={`Foto de ${dish.name}`} decoding="async" /> : null}
        <div className="sheet__body">
          <h2 className="sheet__title" id={titleId}>
            {dish.name}
          </h2>
          {dish.description ? <p className="sheet__desc">{dish.description}</p> : null}
          {dish.is_available ? (
            <PriceTag price={dish.price} cash={dish.price_cash} size="lg" />
          ) : (
            <p className="sheet__out">
              <span className="tag">Agotado</span>
              Por hoy no queda.
            </p>
          )}
        </div>
      </div>
      <div className="sheet__footer">
        <button type="button" className="sheet__close" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
