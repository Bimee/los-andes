'use client';

import { useId, useMemo, useState } from 'react';
import { savePrices } from '@/app/admin/actions';
import { formatPrice, parsePrice, priceToInput } from '@/lib/format';
import type { CategoryWithProducts, Product } from '@/lib/types';
import { useActionRunner } from './useActionRunner';

type Props = { categories: CategoryWithProducts[] };
type Pair = { price: string; cash: string };

const toPair = (p: Product): Pair => ({ price: priceToInput(p.price), cash: priceToInput(p.price_cash) });

function roundTo(value: number, step: number): number {
  return Math.max(0, step > 0 ? Math.round(value / step) * step : Math.round(value));
}

function readPercent(text: string): number {
  return Number(text.replace(',', '.').replace('%', '').trim());
}

/**
 * Todos los precios de la carta en una sola pantalla: el precio y el precio en efectivo
 * o transferencia de cada plato, más dos atajos (aumento en porcentaje y calcular el
 * precio en efectivo con un descuento). Nada se guarda hasta tocar "Guardar precios".
 */
export function PricesEditor({ categories }: Props) {
  const id = useId();
  const { run, pending, show, toast } = useActionRunner();
  const products = useMemo(() => categories.flatMap((c) => c.products), [categories]);
  const saved = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [values, setValues] = useState<Record<string, Pair>>(() =>
    Object.fromEntries(products.map((p) => [p.id, toPair(p)])),
  );
  const [percent, setPercent] = useState('');
  const [target, setTarget] = useState('all');
  const [step, setStep] = useState('100');
  const [discount, setDiscount] = useState('');
  const [discountTarget, setDiscountTarget] = useState('all');
  const [discountStep, setDiscountStep] = useState('50');
  const [error, setError] = useState<string | null>(null);

  const isChanged = (productId: string) => {
    const before = saved.get(productId);
    const pair = values[productId] ?? { price: '', cash: '' };
    const price = parsePrice(pair.price);
    const cash = parsePrice(pair.cash);
    return (
      Number.isNaN(price) ||
      Number.isNaN(cash) ||
      price !== (before?.price ?? null) ||
      cash !== (before?.price_cash ?? null)
    );
  };
  const changedCount = products.filter((p) => isChanged(p.id)).length;

  const inTarget = (categoryId: string, selected: string) => selected === 'all' || categoryId === selected;

  function applyIncrease() {
    setError(null);
    const pct = readPercent(percent);
    if (!Number.isFinite(pct) || pct === 0 || pct < -90 || pct > 300) {
      setError('Escribí el porcentaje de aumento, por ejemplo 10.');
      return;
    }
    const rounding = Number(step);
    const next = { ...values };
    let affected = 0;
    for (const cat of categories) {
      if (!inTarget(cat.id, target)) continue;
      for (const p of cat.products) {
        // Siempre sobre los precios guardados: tocar dos veces no suma dos aumentos
        if (p.price === null && p.price_cash === null) continue;
        next[p.id] = {
          price: p.price === null ? next[p.id].price : priceToInput(roundTo(p.price * (1 + pct / 100), rounding)),
          cash:
            p.price_cash === null ? next[p.id].cash : priceToInput(roundTo(p.price_cash * (1 + pct / 100), rounding)),
        };
        affected++;
      }
    }
    if (affected === 0) {
      setError('No hay precios cargados en esa selección.');
      return;
    }
    setValues(next);
    show(`Listo, revisá los precios marcados y tocá "Guardar precios".`);
  }

  function applyDiscount() {
    setError(null);
    const pct = readPercent(discount);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 90) {
      setError('Escribí el descuento en efectivo, por ejemplo 10.');
      return;
    }
    const rounding = Number(discountStep);
    const next = { ...values };
    let affected = 0;
    for (const cat of categories) {
      if (!inTarget(cat.id, discountTarget)) continue;
      for (const p of cat.products) {
        // Sobre el precio que está escrito ahora (así sirve también después de un aumento)
        const price = parsePrice(next[p.id]?.price ?? '');
        if (price === null || Number.isNaN(price)) continue;
        next[p.id] = { ...next[p.id], cash: priceToInput(roundTo(price * (1 - pct / 100), rounding)) };
        affected++;
      }
    }
    if (affected === 0) {
      setError('No hay precios cargados en esa selección.');
      return;
    }
    setValues(next);
    show(`Listo, revisá los precios en efectivo y tocá "Guardar precios".`);
  }

  function handleSave() {
    setError(null);
    const updates: { id: string; price: number | null; price_cash: number | null }[] = [];
    for (const p of products) {
      const pair = values[p.id] ?? { price: '', cash: '' };
      const price = parsePrice(pair.price);
      const cash = parsePrice(pair.cash);
      if (Number.isNaN(price) || Number.isNaN(cash)) {
        setError(`Revisá los precios de "${p.name}": escribí solo números.`);
        return;
      }
      if (price !== p.price || cash !== p.price_cash) updates.push({ id: p.id, price, price_cash: cash });
    }
    if (updates.length === 0) {
      show('No hay cambios para guardar.');
      return;
    }
    run(() => savePrices(updates));
  }

  function handleUndo() {
    setValues(Object.fromEntries(products.map((p) => [p.id, toPair(p)])));
    setError(null);
  }

  function setField(productId: string, field: keyof Pair, value: string) {
    setValues((prev) => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));
  }

  if (products.length === 0) {
    return <p className="empty-state">Todavía no hay platos en la carta.</p>;
  }

  const targetOptions = (
    <>
      <option value="all">Toda la carta</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </>
  );

  return (
    <>
      <div className="panel">
        <h2 className="admin-section__title">Aumentar varios precios juntos</h2>
        <div className="price-tools">
          <label className="field" htmlFor={`${id}-pct`}>
            <span className="field__label">Porcentaje</span>
            <input
              id={`${id}-pct`}
              className="input"
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="10"
            />
          </label>
          <label className="field" htmlFor={`${id}-target`}>
            <span className="field__label">A qué platos</span>
            <select id={`${id}-target`} className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
              {targetOptions}
            </select>
          </label>
          <label className="field" htmlFor={`${id}-step`}>
            <span className="field__label">Redondear a</span>
            <select id={`${id}-step`} className="input" value={step} onChange={(e) => setStep(e.target.value)}>
              <RoundingOptions />
            </select>
          </label>
        </div>
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn--dark" onClick={applyIncrease}>
            Calcular aumento
          </button>
        </div>
        <p className="field__hint" style={{ marginTop: '0.75rem' }}>
          Sube el precio y el precio en efectivo. Se calcula sobre los precios guardados. El menú no cambia hasta que
          toques &quot;Guardar precios&quot;.
        </p>
      </div>

      <div className="panel">
        <h2 className="admin-section__title">Calcular el precio en efectivo o transferencia</h2>
        <div className="price-tools">
          <label className="field" htmlFor={`${id}-disc`}>
            <span className="field__label">Descuento</span>
            <input
              id={`${id}-disc`}
              className="input"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="10"
            />
          </label>
          <label className="field" htmlFor={`${id}-disc-target`}>
            <span className="field__label">A qué platos</span>
            <select
              id={`${id}-disc-target`}
              className="input"
              value={discountTarget}
              onChange={(e) => setDiscountTarget(e.target.value)}
            >
              {targetOptions}
            </select>
          </label>
          <label className="field" htmlFor={`${id}-disc-step`}>
            <span className="field__label">Redondear a</span>
            <select
              id={`${id}-disc-step`}
              className="input"
              value={discountStep}
              onChange={(e) => setDiscountStep(e.target.value)}
            >
              <RoundingOptions />
            </select>
          </label>
        </div>
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn--dark" onClick={applyDiscount}>
            Calcular precios en efectivo
          </button>
        </div>
        <p className="field__hint" style={{ marginTop: '0.75rem' }}>
          Se calcula sobre el precio de cada plato. Los que no tienen precio no cambian. Si también vas a aumentar,
          calculá primero el aumento. Si un plato no tiene descuento, borrá su precio en efectivo.
        </p>
      </div>

      {categories
        .filter((c) => c.products.length > 0)
        .map((cat) => (
          <section key={cat.id} className="price-group">
            <h2 className="price-group__title">{cat.name}</h2>
            {cat.products.map((p) => {
              const changed = isChanged(p.id);
              const inputId = `${id}-${p.id}`;
              const pair = values[p.id] ?? { price: '', cash: '' };
              return (
                <div key={p.id} className={changed ? 'price-row price-row--changed' : 'price-row'}>
                  <p className="price-row__name">
                    {p.name}
                    {changed ? <span className="price-row__before">Antes: {describeBefore(p)}</span> : null}
                  </p>
                  <div className="price-row__inputs">
                    <label className="price-row__field" htmlFor={`${inputId}-price`}>
                      <span className="price-row__label">
                        <span className="visually-hidden">{p.name}: </span>Precio
                      </span>
                      <span className="price-input">
                        <input
                          id={`${inputId}-price`}
                          className="input input--price"
                          inputMode="decimal"
                          autoComplete="off"
                          value={pair.price}
                          onChange={(e) => setField(p.id, 'price', e.target.value)}
                        />
                      </span>
                    </label>
                    <label className="price-row__field" htmlFor={`${inputId}-cash`}>
                      <span className="price-row__label">
                        <span className="visually-hidden">{p.name}: </span>Efectivo o transf.
                      </span>
                      <span className="price-input">
                        <input
                          id={`${inputId}-cash`}
                          className="input input--price"
                          inputMode="decimal"
                          autoComplete="off"
                          value={pair.cash}
                          onChange={(e) => setField(p.id, 'cash', e.target.value)}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </section>
        ))}

      <div className="sticky-bar">
        {error ? (
          <p className="form-error" role="alert" style={{ marginBottom: '0.75rem' }}>
            {error}
          </p>
        ) : null}
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            style={{ flex: '1 1 12rem' }}
            disabled={pending || changedCount === 0}
            onClick={handleSave}
          >
            {pending
              ? 'Guardando…'
              : changedCount === 0
                ? 'Sin cambios'
                : changedCount === 1
                  ? 'Guardar precios de 1 plato'
                  : `Guardar precios de ${changedCount} platos`}
          </button>
          <button type="button" className="btn" disabled={pending || changedCount === 0} onClick={handleUndo}>
            Deshacer
          </button>
        </div>
      </div>

      {toast}
    </>
  );
}

function RoundingOptions() {
  return (
    <>
      <option value="100">$ 100</option>
      <option value="50">$ 50</option>
      <option value="10">$ 10</option>
      <option value="0">Sin redondear</option>
    </>
  );
}

function describeBefore(p: Product): string {
  const price = formatPrice(p.price);
  const cash = formatPrice(p.price_cash);
  if (!price && !cash) return 'sin precio';
  return [price ?? 'sin precio', cash ? `efectivo ${cash}` : null].filter(Boolean).join(' · ');
}
