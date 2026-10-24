import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Young_Serif } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// next/font descarga las fuentes en el build y las sirve desde el mismo dominio:
// el navegador no le pide nada a Google. Las dos tienen licencia SIL OFL (uso comercial libre).

/** Títulos, nombres de categoría y precios: serif robusta, de cartel de comercio de barrio. Un solo peso. */
const display = Young_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

/** Texto: diseñada por el Braille Institute para personas con baja visión. */
const body = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  // Next no trae métricas de esta fuente para ajustar el respaldo: Verdana tiene un ancho parecido
  adjustFontFallback: false,
  fallback: ['Verdana', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Rotisería Los Andes | Menú',
  description: 'Menú del día y carta de la Rotisería Los Andes, en La Calera. Horarios y pedidos.',
};

export const viewport: Viewport = {
  themeColor: '#eef1eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
