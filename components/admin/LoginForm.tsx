'use client';

import { useActionState, useId, useState } from 'react';
import { login, type LoginState } from '@/app/admin/actions';

export function LoginForm() {
  const id = useId();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="form-grid" action={formAction}>
      <label className="field" htmlFor={`${id}-email`}>
        <span className="field__label">Email</span>
        <input
          id={`${id}-email`}
          className="input"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
        />
      </label>
      <label className="field" htmlFor={`${id}-password`}>
        <span className="field__label">Contraseña</span>
        <input
          id={`${id}-password`}
          className="input"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="check">
        <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
        Mostrar contraseña
      </label>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
