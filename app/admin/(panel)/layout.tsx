import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { SetupNotice } from '@/components/admin/SetupNotice';
import { requireStaff } from '@/lib/auth';
import { hasSupabaseEnv } from '@/lib/config';
import { logout } from '../actions';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseEnv()) return <SetupNotice />;
  await requireStaff();

  return (
    <>
      <header className="admin-bar">
        <Link href="/admin" className="admin-bar__brand">
          Panel de Los Andes
        </Link>
        <div className="btn-row">
          <a className="btn btn--sm" href="/" target="_blank" rel="noopener noreferrer">
            Ver menú
          </a>
          <form action={logout}>
            <button type="submit" className="btn btn--sm">
              Salir
            </button>
          </form>
        </div>
      </header>
      <AdminNav />
      <main className="admin-main">{children}</main>
    </>
  );
}
