'use client';

import { type FormEvent, useId, useState } from 'react';
import { saveSettings } from '@/app/admin/actions';
import type { Settings } from '@/lib/types';
import { useActionRunner } from './useActionRunner';

export function SettingsForm({ settings }: { settings: Settings }) {
  const id = useId();
  const { run, pending, toast } = useActionRunner();
  const [values, setValues] = useState({
    business_name: settings.business_name ?? '',
    tagline: settings.tagline ?? '',
    phone: settings.phone ?? '',
    whatsapp: settings.whatsapp ?? '',
    address: settings.address ?? '',
  });

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => saveSettings(values));
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit} noValidate>
      <label className="field" htmlFor={`${id}-name`}>
        <span className="field__label">Nombre del local</span>
        <input id={`${id}-name`} className="input" value={values.business_name} onChange={set('business_name')} maxLength={60} />
      </label>
      <label className="field" htmlFor={`${id}-tagline`}>
        <span className="field__label">Debajo del nombre</span>
        <input id={`${id}-tagline`} className="input" value={values.tagline} onChange={set('tagline')} maxLength={80} />
        <span className="field__hint">Por ejemplo: Rotisería en La Calera</span>
      </label>
      <label className="field" htmlFor={`${id}-phone`}>
        <span className="field__label">Teléfono del local</span>
        <input id={`${id}-phone`} className="input" type="tel" value={values.phone} onChange={set('phone')} maxLength={30} />
        <span className="field__hint">Queda guardado para el panel. En el menú el contacto es por WhatsApp.</span>
      </label>
      <label className="field" htmlFor={`${id}-wa`}>
        <span className="field__label">WhatsApp</span>
        <input
          id={`${id}-wa`}
          className="input"
          inputMode="numeric"
          value={values.whatsapp}
          onChange={set('whatsapp')}
          maxLength={20}
        />
        <span className="field__hint">
          549 + característica sin el 0 + número sin el 15. Ejemplo: 5493516360127. Vacío = sin botón de WhatsApp.
        </span>
      </label>
      <label className="field" htmlFor={`${id}-address`}>
        <span className="field__label">Dirección</span>
        <input id={`${id}-address`} className="input" value={values.address} onChange={set('address')} maxLength={120} />
      </label>
      <div>
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar datos'}
        </button>
      </div>
      {toast}
    </form>
  );
}
