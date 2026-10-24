import { imageUrl } from '@/lib/config';
import { formatPrice } from '@/lib/format';

type Props = {
  name: string;
  description: string | null;
  price: number | null;
  price_cash?: number | null;
  image_path: string | null;
  is_available: boolean;
  hidden?: boolean;
};

/** Resumen de un plato en las listas del panel. */
export function ItemSummary({ name, description, price, price_cash, image_path, is_available, hidden }: Props) {
  const src = imageUrl(image_path);
  const formatted = formatPrice(price);
  const cash = formatPrice(price_cash);

  return (
    <div className={src ? 'item__main item__main--photo' : 'item__main'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img className="item__photo" src={src} alt="" loading="lazy" /> : null}
      <div>
        <p className="item__name">{name}</p>
        {description ? <p className="item__desc">{description}</p> : null}
        {!is_available || hidden ? (
          <div className="item__badges">
            {!is_available ? <span className="badge">Agotado</span> : null}
            {hidden ? <span className="badge badge--soft">Oculto en el menú</span> : null}
          </div>
        ) : null}
      </div>
      <span className="item__price">
        {formatted ?? 'Sin precio'}
        {cash ? <span className="item__price-cash">Efectivo {cash}</span> : null}
      </span>
    </div>
  );
}
