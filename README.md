# Menú digital · Rotisería Los Andes (La Calera)

Menú con QR, mobile first, con panel para que la encargada cargue el menú del día y el local actualice la carta, precios, fotos, horarios y cierres.

**Stack:** Next.js 16 (App Router, Server Actions, `proxy.ts`) · Supabase (Postgres + Auth + Storage, con RLS) · Vercel · CSS propio (sin Tailwind) · fuentes Young Serif + Atkinson Hyperlegible Next autoalojadas con `next/font`.

## Qué incluye

**Menú público**
- **Inicio (`/`)**: encabezado compacto con el nombre, el estado en una línea ("Abierto · cierra 15:30" / "Cerrado · abre mañana 10:00", con la hora de Córdoba y actualizado solo) y un acceso discreto a WhatsApp con su logo. Debajo, el **menú del día** como tarjeta destacada con la fecha y los platos, y **la carta** en una grilla de categorías con foto (2 columnas en el celular, 3 en tablet y 4 en escritorio).
- **Categoría (`/carta/[slug]`)**: botón grande "Volver a la carta", chips para saltar a otra categoría y los platos en tarjetas: nombre y descripción con la foto cuadrada al lado, y abajo una franja con los precios rotulados ("Precio" y "Efectivo o transferencia") o "Agotado".
- **Menú del día (`/menu-del-dia`)**: los platos de hoy con precios, o un aviso claro si todavía no está cargado, si hoy no se abre o si el local cerró a mano.
- **Detalle del plato**: al tocar un plato se abre una hoja inferior (modal centrado en escritorio) con la foto grande, la descripción completa, el precio y un botón "Cerrar" grande. El botón atrás del celular cierra el detalle sin salir de la página.
- **Dos precios por plato**: el de lista y, si se carga, el de efectivo o transferencia.
- **Pedidos y horarios** al final de todas las páginas: WhatsApp, horarios, dirección con link al mapa. No hay botón de llamar (pedido del cliente).
- Letra base de 19 px, contraste AA, áreas táctiles de 48 px o más, foco de teclado visible, animaciones cortas que respetan "reducir movimiento".

**Panel (`/admin`)**
- **Menú del día:** cargar por fecha (hoy, mañana u otro día), copiar el menú de un día anterior, editar, agotado, ordenar, borrar.
- **Carta:** categorías (crear, renombrar, ordenar, ocultar, borrar si está vacía, **foto de la categoría**) y platos (agregar, editar, foto, agotado, ocultar, ordenar, borrar).
- **Precios:** todos en una pantalla, con precio y precio en efectivo por plato. Atajos: aumento por porcentaje (sube los dos) y **calcular el precio en efectivo con un descuento**, con redondeo.
- **Abierto o cerrado:** "Cerrar por hoy" o cerrar hasta una fecha con mensaje. Se vence solo.
- **Horarios y datos:** horarios por día, teléfono, WhatsApp, dirección.
- **Código QR** listo para imprimir o descargar en SVG.

## Probarlo ya (modo demo)

```bash
npm install
npm run dev
```

Sin `.env.local`, `http://localhost:3000` muestra los platos reales del local con **precios, descripciones y fotos de muestra** (`lib/demo-muestra.ts` y `public/muestra/`) y un menú del día de ejemplo. Sirve para presentar el diseño: nada de la muestra llega a Supabase, porque `seed-carta.sql` sale de `lib/carta.ts`, que solo tiene la carta real. El panel pide configurar Supabase.

Para revisar estados sin esperar a que cambie la hora (solo en modo demo, con Supabase se ignora):

| URL | Qué muestra |
|---|---|
| `/?demo=abierto` | Abierto a cualquier hora |
| `/?demo=cerrado` | Cierre manual de hoy con mensaje |
| `/?demo=sin-menu` | Menú del día sin cargar |
| `/?demo=abierto,sin-menu` | Se pueden combinar |

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto (región **South America (São Paulo)**, la más cercana).
2. **SQL Editor** → corré, en este orden:
   1. `supabase/schema.sql` completo (tablas, RLS, bucket de fotos, horarios base).
   2. `supabase/seed-carta.sql`: la carta real del local (10 categorías, 95 platos, sin precios) y los datos del local (teléfono, WhatsApp, dirección).
3. **Authentication → Sign In / Providers → Email:** desactivá *Allow new users to sign up*. Solo vos creás usuarios.
4. **Authentication → Users → Add user → Create new user** con email y contraseña, tildando *Auto Confirm User*. Uno por persona o uno compartido del local.
5. Habilitá cada usuario en el panel (SQL Editor):

   ```sql
   insert into public.staff (user_id, name)
   select id, 'Encargada' from auth.users where email = 'encargada@ejemplo.com'
   on conflict (user_id) do nothing;
   ```

> Si los nombres de los menús de Supabase cambiaron, buscá la opción equivalente: la idea es *sin registro público* y *usuarios creados a mano*.

**¿La base ya existía con la v1?** No vuelvas a correr `schema.sql`: corré `supabase/migrations/20261023120000_categorias_slug_foto_precio_efectivo.sql` (agrega slug y foto a las categorías y el precio en efectivo) y después `supabase/seed-carta.sql`, que además borra la carta de ejemplo de la v1 si sigue cargada.

`seed-carta.sql` se puede correr más de una vez: no duplica nada y no toca lo que ya se cargó desde el panel (precios, fotos, agotados, nombres, orden). Ojo: si se borró un plato desde el panel, vuelve a aparecer.

### 2. Variables de entorno

Copiá `.env.example` como `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://dominio-final.com.ar
```

La URL y la publishable key están en **Project Settings → API Keys** (si el proyecto es viejo y solo tiene la `anon` key, también funciona en esa variable).

### 3. Deploy en Vercel

1. Subí el repo a GitHub e importalo en Vercel.
2. Cargá las 3 variables en **Settings → Environment Variables**.
3. Conectá el dominio y poné ese dominio en `NEXT_PUBLIC_SITE_URL` (es lo que va en el QR). Redeploy.
4. Entrá a `/admin`, revisá **Horarios y datos**, cargá los **precios** y las **fotos de las categorías**.
5. **Código QR → Imprimir.** El QR no cambia nunca: los platos y precios se actualizan solos.

## Estructura

```
app/
  page.tsx                 inicio: menú del día + grilla de categorías
  carta/[slug]/page.tsx    una categoría con sus platos
  menu-del-dia/page.tsx    el menú del día completo
  not-found.tsx            página no encontrada (categoría oculta o inexistente)
  layout.tsx               fuentes (next/font) y metadatos
  globals.css              tokens de la paleta, superficies y estilos del menú
  admin/
    actions.ts             todas las Server Actions (validan staff + RLS)
    admin.css              estilos del panel
    login/page.tsx
    (panel)/               inicio, menu-del-dia, carta, precios, ajustes, qr
components/
  menu/                    MenuFrame (encabezado + pie), TodayCard, CategoryCard,
                           CategoryChips, DishList (tarjetas + detalle), PriceTag,
                           StatusLine / StatusBar (estado en vivo), BackLink, icons
  admin/                   formularios y gestores del panel (CategoryPhoto: foto de categoría)
lib/
  hours.ts                 hora de Córdoba, estado abierto/cerrado, resumen de horarios
  format.ts                precios en ARS, links tel/WhatsApp/mapa, parseo de precios
  data.ts / admin-data.ts  lecturas de Supabase
  carta.ts                 la carta real del local (fuente de seed-carta.sql)
  demo-muestra.ts          precios, descripciones y fotos de muestra (solo modo demo)
  demo-data.ts             arma el modo demo: carta real + muestra + menú del día de ejemplo
  auth.ts                  sesión del panel (getClaims + is_staff)
  image.ts                 compresión de fotos en el navegador (WebP/JPEG, 1200 px)
  supabase/                clientes server, browser y público
public/muestra/            fotos de muestra del modo demo y sus créditos (CREDITOS.txt)
proxy.ts                   refresco de sesión en /admin (Next 16 reemplaza middleware.ts)
supabase/
  schema.sql               tablas, RLS, bucket de fotos, horarios base (proyecto nuevo)
  migrations/              cambios para bases creadas con una versión anterior
  seed-carta.sql           la carta real del local
```

## Decisiones técnicas

- **Hora del local:** Vercel corre en UTC, así que todo "hoy" y "ahora" se calcula con `America/Argentina/Cordoba` (`lib/hours.ts`).
- **Render dinámico:** las páginas públicas llaman a `connection()` para que nunca quede una versión vieja cacheada del menú. `getPublicMenu` usa `cache()`: la página y sus metadatos leen la base una sola vez por visita.
- **Seguridad:** registro deshabilitado + tabla `staff` + función `is_staff()` en todas las políticas RLS. Aunque alguien consiga un usuario, si no está en `staff` no puede escribir nada.
- **Fotos:** se comprimen en el celular antes de subir (una foto de 4 MB queda en ~150 KB) y van directo a Storage, al mismo bucket para platos y categorías. Al reemplazar o borrar, la foto se borra solo si nadie más la usa (el menú copiado comparte fotos).
- **Slug de categoría:** lo genera la base desde el nombre al crearla (trigger `categories_slug`: "Sándwiches" → `sandwiches`, y si se repite, `pollo-2`). No cambia al renombrar, así los links que ya circulan siguen andando.
- **Precio en efectivo o transferencia:** es un segundo precio opcional por plato (`price_cash`), no un porcentaje fijo, porque no todos los platos tienen descuento (los adicionales, por ejemplo). El panel lo calcula en masa con un porcentaje.
- **Menú del día:** va como tarjeta destacada (superficie oscura) arriba de la grilla, con la fecha y hasta 4 platos. Así se ve qué hay hoy sin tocar nada, entra en la primera pantalla junto con la primera fila de categorías y se abre con el mismo gesto que una categoría. Con el local cerrado a mano no se muestra aunque esté cargado.
- **Detalle del plato y botón atrás:** usa `<dialog>` nativo. Al abrirlo se agrega una entrada al historial (`history.pushState`, que Next.js 16 integra con su router); el atrás del celular la saca y cierra el detalle. Cerrar con el botón, Escape o tocando el fondo también saca esa entrada, así no queda un "atrás" que no hace nada.
- **Superficies:** fondo papel (`--bg`), tarjeta blanca con borde (`--surface`) y destacado charcoal (`--feature`), más un papel hundido para el pie y los agotados. Sombras con el tono del charcoal. Hovers solo con `@media (hover: hover)`; en táctil, `:active`; el foco de teclado se ve igual que el hover más un anillo.
- **Fuentes:** Young Serif (títulos, nombres de categoría y precios; un solo peso, de cartel de comercio de barrio) + Atkinson Hyperlegible Next (texto; diseñada por el Braille Institute para baja visión). Las dos con licencia SIL OFL, uso comercial libre. `next/font` las descarga en el build y las sirve desde el mismo dominio: el navegador no le pide nada a Google. Atkinson trae el cero cruzado a propósito (para no confundirlo con la O); por eso los precios grandes van en Young Serif.
- **Sesión larga:** Supabase refresca el token, así que en el celular de la encargada queda logueado.
- **Cierre manual con vencimiento:** se guarda "cerrado hasta tal fecha". Si nadie lo vuelve a abrir, al día siguiente vuelve solo al horario normal.

## Guía rápida para el local

**Cargar el menú del día** (todas las mañanas, o la noche anterior)
1. Entrar a la dirección del sitio + `/admin` y tocar **Menú del día**.
2. **Agregar plato** → nombre, precio (y precio en efectivo si tiene), foto si querés → **Agregar al menú**.
3. Si se repiten platos: **Copiar el menú del…** y cambiar lo que haga falta.
4. Si algo se termina: **Marcar agotado**.

**Cambiar precios:** **Precios** → escribir el precio nuevo, o usar *Aumentar varios precios juntos* y después *Calcular el precio en efectivo o transferencia* → **Guardar precios**.

**Foto de una categoría:** **Carta** → tocar la categoría → **Foto de la categoría** → **Agregar foto**. Se guarda sola. Mejor una foto apaisada y de cerca.

**Feriado o vacaciones:** en **Inicio**, **Cerrar por hoy**, o *Cerrar varios días* con la fecha y un mensaje.

## Ideas para una segunda etapa

- Pedidos por WhatsApp con el pedido armado desde el menú (carrito simple).
- Plantillas de menú semanal (lunes: guiso, viernes: pescado…).
- Estadísticas de visitas al QR con Vercel Analytics.
