# Contexto del proyecto: menú digital Rotisería Los Andes

Cliente de BIME Studio. Rotisería en La Calera (Córdoba). Público mayormente adulto mayor; el panel lo usan personas mayores y una encargada joven que carga el menú del día.

## Requisitos del cliente
- Menú por QR, mobile first, estética profesional y minimalista. La carta es lo principal; contacto y horarios van en segundo plano.
- Secciones: "Menú del día" (cambia todos los días, tarjeta destacada arriba de la grilla) y la carta en grilla de categorías con foto.
- Estado abierto/cerrado. Horario: lunes a sábado de 10:00 a 15:30.
- Paleta fija: ash-grey #cad2c5, muted-teal #84a98c, deep-teal #52796f, dark-slate-grey #354f52, charcoal-blue #2f3e46.
- Fuentes: Young Serif (títulos, categorías, precios; un solo peso, 400) + Atkinson Hyperlegible Next (texto). Con `next/font/google`, autoalojadas, licencia OFL.
- Dos precios por plato: el de lista y el de efectivo o transferencia (`price_cash`, opcional). Efectivo y transferencia valen lo mismo.
- Milanesas es una categoría propia (las de ternera y la de pollo).
- Contacto solo por WhatsApp (logo oficial, verde de marca). El botón de llamar se sacó a pedido del cliente; el teléfono queda guardado en el panel.
- Extras pedidos: cierre manual, fotos de platos y de categorías, agotados, edición de precios e imágenes, alta/baja de productos.

## Stack y convenciones
- Next.js 16 App Router: `proxy.ts` (no middleware.ts), `params`/`searchParams` son Promise, `connection()` para render dinámico.
- Supabase con `@supabase/ssr` (solo getAll/setAll), `getClaims()` para verificar sesión, RLS con `public.is_staff()`.
- Mutaciones solo vía Server Actions en `app/admin/actions.ts`; devuelven `ActionResult` y llaman `revalidatePath('/', 'layout')`.
- Rutas públicas: `/`, `/carta/[slug]`, `/menu-del-dia`. Todas usan `MenuFrame` (encabezado + pie "Pedidos y horarios") y `getPublicMenu()` (con `cache()`).
- El slug de la categoría lo genera la base (trigger `categories_slug`) al crearla y no cambia al renombrarla.
- Cambios de esquema: actualizar `supabase/schema.sql` (proyecto nuevo) y agregar un archivo idempotente en `supabase/migrations/` (bases existentes).
- La carta real vive en `lib/carta.ts` (`CARTA`, sin imports) y en `supabase/seed-carta.sql`; si cambia una, regenerar la otra.
- Precios, descripciones y fotos de muestra viven solo en `lib/demo-muestra.ts` + `public/muestra/` y se usan solo en modo demo. Nunca pasarlos al SQL ni a la base.
- Tarjeta de plato: nombre y descripción a la izquierda, foto cuadrada a la derecha, franja de precios rotulada abajo (`PriceTag`).
- CSS propio con tokens en `app/globals.css` y `app/admin/admin.css`. Sin Tailwind ni librerías de UI. Superficies: `--bg` (papel), `--surface` (tarjeta), `--feature` (destacado), `--surface-sunk`.
- Hovers solo dentro de `@media (hover: hover)`, con `:active` equivalente; `:focus-visible` igual de claro. Transiciones de 150–200 ms dentro de `prefers-reduced-motion: no-preference`.
- Textos de la UI en español rioplatense, simples, sentence case, sin mayúsculas sostenidas.
- Accesibilidad: base 19 px, áreas táctiles ≥ 48 px (botones del panel ≥ 52 px), contraste AA. No usar muted-teal ni deep-teal para texto chico sobre fondo claro.
- Todo cálculo de fecha/hora pasa por `lib/hours.ts` (zona America/Argentina/Cordoba).

## Estado
- v2: rediseño del menú público (encabezado compacto, grilla de categorías, página por categoría, detalle en hoja inferior con botón atrás), carta real cargada (10 categorías, 95 platos), foto de categoría y precio en efectivo en el panel.
- Sin Supabase corre en modo demo (`lib/demo-data.ts`: carta real + muestra); `?demo=abierto|cerrado|sin-menu` fuerza estados solo en ese modo.
- Verificado: `tsc` y `next build` sin errores; SQL probado en PGlite (schema nuevo, migración desde v1, seed idempotente, RLS); capturas en 360, 390, 768 y 1280; teclado y botón atrás; componentes del panel con datos demo.
- No verificado de punta a punta: guardar y subir fotos contra un Supabase real (no hay proyecto creado todavía).
- Pendiente: crear proyecto Supabase y correr el SQL, cargar precios (el PDF no los trae), fotos de categorías y platos, dominio y QR.
- Dudas abiertas del PDF: "Papas fritas tamaño 105 / 102", de qué carne son las "Costeletas", monto del extra por plato para compartir.
