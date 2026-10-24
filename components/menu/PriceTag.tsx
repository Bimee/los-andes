import { formatPrice } from '@/lib/format';

/**
 * Franja de precios: "Precio $ 9.500 | Efectivo o transferencia $ 8.550".
 * Cada valor con su rótulo, así se lee sin adivinar cuál es cuál. Sin precios no muestra nada.
 */
export function PriceTag({
  price,
  cash,
  size = 'md',
}: {
  price: number | null;
  cash: number | null;
  size?: 'md' | 'lg';
}) {
  const main = formatPrice(price);
  const alt = cash !== null && cash !== price ? formatPrice(cash) : null;
  if (!main && !alt) return null;

  return (
    <dl className={size === 'lg' ? 'price price--lg' : 'price'}>
      {main ? (
        <div className="price__cell">
          <dt>Precio</dt>
          <dd>{main}</dd>
        </div>
      ) : null}
      {alt ? (
        <div className="price__cell">
          <dt>Efectivo o transferencia</dt>
          <dd>{alt}</dd>
        </div>
      ) : null}
    </dl>
  );
}
