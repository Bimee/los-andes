import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { PrintButton } from '@/components/admin/PrintButton';
import { getSettings } from '@/lib/admin-data';
import { requireStaff } from '@/lib/auth';

async function getSiteUrl(): Promise<{ url: string; fromEnv: boolean }> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (fromEnv) return { url: fromEnv, fromEnv: true };
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return { url: `${proto}://${host}`, fromEnv: false };
}

export default async function QrPage() {
  const db = await requireStaff();
  const [settings, site] = await Promise.all([getSettings(db), getSiteUrl()]);

  const svg = await QRCode.toString(site.url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#2f3e46', light: '#ffffff' },
  });
  const downloadHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <>
      <div className="no-print">
        <h1 className="admin-title">Código QR</h1>
        <p className="admin-lead">
          Imprimilo y pegalo en el mostrador o la vidriera. Siempre lleva al menú actualizado: no hace falta
          reimprimirlo cuando cambian los platos o los precios.
        </p>
        {!site.fromEnv ? (
          <p className="form-error" style={{ marginBottom: '1.5rem' }}>
            Este QR usa la dirección actual ({site.url}). Antes de imprimir, cargá NEXT_PUBLIC_SITE_URL con el
            dominio definitivo.
          </p>
        ) : null}
      </div>

      <div className="qr-card">
        <p className="qr-card__name">{settings.business_name}</p>
        {settings.tagline ? <p className="qr-card__tagline">{settings.tagline}</p> : null}
        <div
          className="qr-card__code"
          role="img"
          aria-label={`Código QR que abre ${site.url}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="qr-card__cta">Escaneá y mirá el menú del día</p>
        <p className="qr-card__url">{site.url.replace(/^https?:\/\//, '')}</p>
      </div>

      <div className="btn-row no-print" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
        <PrintButton />
        <a className="btn" href={downloadHref} download="qr-menu-los-andes.svg">
          Descargar QR
        </a>
      </div>
    </>
  );
}
