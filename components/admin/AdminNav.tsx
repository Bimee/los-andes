'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/menu-del-dia', label: 'Menú del día' },
  { href: '/admin/carta', label: 'Carta' },
  { href: '/admin/precios', label: 'Precios' },
  { href: '/admin/ajustes', label: 'Horarios y datos' },
  { href: '/admin/qr', label: 'Código QR' },
];

/** Navegación siempre visible (sin menú hamburguesa escondido). */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Secciones del panel">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
