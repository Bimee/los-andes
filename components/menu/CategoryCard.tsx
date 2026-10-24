import Link from 'next/link';
import { imageUrl } from '@/lib/config';
import type { CategoryWithProducts } from '@/lib/types';

const TONES = 5;

/** Tarjeta de la grilla: foto 4:3 (o un tono de la paleta con la inicial) y el nombre. */
export function CategoryCard({ category, index }: { category: CategoryWithProducts; index: number }) {
  const src = imageUrl(category.image_path);
  const count = category.products.length;

  return (
    <li className="cat-card">
      <div className={src ? 'cat-card__media' : `cat-card__media tone-${index % TONES}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" width={400} height={300} loading="lazy" decoding="async" />
        ) : (
          <span className="cat-card__initial" aria-hidden="true">
            {category.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="cat-card__body">
        <h3 className="cat-card__name">
          <Link className="cat-card__link" href={`/carta/${category.slug}`}>
            {category.name}
          </Link>
        </h3>
        <p className="cat-card__count">{count === 1 ? '1 plato' : `${count} platos`}</p>
      </div>
    </li>
  );
}
