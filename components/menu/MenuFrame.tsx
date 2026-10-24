import Link from 'next/link';
import type { ReactNode } from 'react';
import { CREDIT, WHATSAPP_GREETING } from '@/lib/config';
import type { PublicMenu } from '@/lib/data';
import { mapsHref, whatsappHref } from '@/lib/format';
import { summarizeHours } from '@/lib/hours';
import type { StoreStatus } from '@/lib/types';
import { MapIcon, WhatsAppIcon } from './icons';
import { StatusLine } from './StatusLine';

type Props = {
  menu: PublicMenu;
  status: StoreStatus;
  /** En el inicio el nombre del local es el h1; en las otras páginas, el h1 es el título de la página. */
  home?: boolean;
  children: ReactNode;
};

/** Encabezado compacto + contenido + pie "Pedidos y horarios". Lo comparten todas las páginas públicas. */
export function MenuFrame({ menu, status, home = false, children }: Props) {
  const { settings, hours } = menu;
  const Name = home ? 'h1' : 'p';

  return (
    <>
      {menu.demo ? (
        <p className="demo-banner">
          Demo: precios, descripciones y fotos de muestra. <a href="/muestra/CREDITOS.txt">Créditos</a>
        </p>
      ) : null}

      <header className="site-head">
        <div className="site-head__inner shell">
          <div>
            <Name className="site-head__name">
              {home ? settings.business_name : <Link href="/">{settings.business_name}</Link>}
            </Name>
            {settings.tagline ? <p className="site-head__tag">{settings.tagline}</p> : null}
          </div>

          {settings.whatsapp ? (
            <a
              className="icon-btn site-head__action"
              href={whatsappHref(settings.whatsapp, WHATSAPP_GREETING)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribir por WhatsApp"
            >
              <WhatsAppIcon />
              <span className="icon-btn__label">WhatsApp</span>
            </a>
          ) : null}

          <StatusLine
            initial={status}
            hours={hours}
            closedUntil={settings.closed_until}
            closedMessage={settings.closed_message}
          />
        </div>
      </header>

      <main className="shell site-main">{children}</main>

      <footer className="orders" id="pedidos" aria-labelledby="pedidos-title">
        <div className="shell">
          <h2 className="orders__title" id="pedidos-title">
            Pedidos y horarios
          </h2>

          {settings.whatsapp ? (
            <>
              <p className="orders__lead">Consultas y delivery por WhatsApp.</p>
              <div className="orders__actions">
                <a
                  className="contact-btn"
                  href={whatsappHref(settings.whatsapp, WHATSAPP_GREETING)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  Escribinos por WhatsApp
                </a>
              </div>
            </>
          ) : null}

          <div className="orders__grid">
            <section aria-labelledby="horarios-title">
              <h3 className="orders__subtitle" id="horarios-title">
                Horarios
              </h3>
              <dl className="hours">
                {summarizeHours(hours).map((row) => (
                  <div key={row.label} style={{ display: 'contents' }}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              {status.manual ? (
                <p className="orders__note">
                  {status.headline}. {status.note ?? status.detail}
                </p>
              ) : null}
            </section>

            {settings.address ? (
              <section aria-labelledby="direccion-title">
                <h3 className="orders__subtitle" id="direccion-title">
                  Dirección
                </h3>
                <p className="orders__text">{settings.address}</p>
                <a className="text-link" href={mapsHref(settings.address)} target="_blank" rel="noopener noreferrer">
                  <MapIcon />
                  Ver en el mapa
                </a>
              </section>
            ) : null}
          </div>

          <p className="orders__fine">
            Todos nuestros platos se elaboran en el momento para garantizar frescura y calidad.
          </p>
          <p className="orders__fine">Precios en pesos argentinos. Pueden cambiar sin previo aviso.</p>
          <p className="orders__credit">{CREDIT.href ? <a href={CREDIT.href}>{CREDIT.label}</a> : CREDIT.label}</p>
        </div>
      </footer>
    </>
  );
}
