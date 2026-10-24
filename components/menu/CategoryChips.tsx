'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

type Props = {
  categories: { slug: string; name: string }[];
  /** slug de la categoría abierta, o 'menu-del-dia' */
  current: string;
};

/** Accesos para saltar a otra categoría sin volver a la carta. */
export function CategoryChips({ categories, current }: Props) {
  const listRef = useRef<HTMLUListElement>(null);

  // En el celular la fila se desliza: centrar el chip actual (sin mover la página)
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = Math.max(0, active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2);
  }, [current]);

  return (
    <nav className="chips" aria-label="Categorías de la carta">
      <ul className="chips__list" ref={listRef}>
        <li>
          <Link
            className="chip chip--today"
            href="/menu-del-dia"
            aria-current={current === 'menu-del-dia' ? 'page' : undefined}
          >
            Menú del día
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link className="chip" href={`/carta/${c.slug}`} aria-current={current === c.slug ? 'page' : undefined}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
