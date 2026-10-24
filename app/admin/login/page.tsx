import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { SetupNotice } from '@/components/admin/SetupNotice';
import { getStaffSession } from '@/lib/auth';
import { hasSupabaseEnv } from '@/lib/config';
import { logout } from '../actions';

export default async function LoginPage() {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const { user, isStaff } = await getStaffSession();
  if (user && isStaff) redirect('/admin');

  return (
    <main className="login">
      <h1 className="login__title">Los Andes</h1>
      <p className="login__lead">Entrá para actualizar el menú.</p>

      <div className="panel">
        {user ? (
          <div className="form-grid">
            <p className="form-error">
              Este usuario{user.email ? ` (${user.email})` : ''} no tiene permiso para editar el menú. Pedile
              a quien armó el sitio que lo habilite.
            </p>
            <form action={logout}>
              <button type="submit" className="btn btn--block">
                Salir
              </button>
            </form>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>

      <p style={{ marginTop: '1.5rem' }}>
        <a href="/">Ver el menú</a>
      </p>
    </main>
  );
}
