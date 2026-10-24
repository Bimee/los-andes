-- ============================================================
-- Rotisería Los Andes · Menú digital
-- Esquema completo para Supabase (Postgres 15+)
-- Correr entero en: Supabase > SQL Editor > New query
-- Proyecto nuevo: alcanza con este archivo.
-- Base creada con la v1 de este archivo: correr además supabase/migrations/, en orden.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Personal autorizado a usar el panel
-- ------------------------------------------------------------
create table if not exists public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

drop policy if exists "staff: cada uno ve su fila" on public.staff;
create policy "staff: cada uno ve su fila"
  on public.staff for select to authenticated
  using (user_id = (select auth.uid()));

-- true si el usuario logueado está en public.staff.
-- security definer: puede leer staff aunque RLS restrinja la tabla.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff where user_id = (select auth.uid())
  );
$$;

-- Las políticas de lectura pública también la evalúan, así que anon necesita poder ejecutarla
grant execute on function public.is_staff() to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Datos del local (una sola fila, id = 1)
-- ------------------------------------------------------------
create table if not exists public.settings (
  id             smallint primary key default 1 check (id = 1),
  business_name  text not null default 'Los Andes' check (char_length(business_name) between 1 and 60),
  tagline        text default 'Rotisería en La Calera' check (char_length(tagline) <= 80),
  phone          text check (char_length(phone) <= 30),       -- como se muestra: 03543 41-2345
  whatsapp       text check (whatsapp ~ '^[0-9]{8,15}$'),     -- solo dígitos con código país: 5493543412345
  address        text check (char_length(address) <= 120),
  closed_until   date,                                        -- cierre manual: cerrado hasta esta fecha inclusive
  closed_message text check (char_length(closed_message) <= 160),
  updated_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Horarios de atención (0 = domingo … 6 = sábado)
-- ------------------------------------------------------------
create table if not exists public.opening_hours (
  weekday   smallint primary key check (weekday between 0 and 6),
  is_open   boolean not null default true,
  opens_at  time not null default '10:00',
  closes_at time not null default '15:30',
  check (closes_at > opens_at)
);

-- ------------------------------------------------------------
-- 4. Carta: categorías y productos
-- ------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  slug       text not null,                -- URL /carta/<slug>; la completa el trigger categories_slug
  image_path text,                         -- foto de la tarjeta en la grilla (bucket "platos")
  position   integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_slug_key on public.categories (slug);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  -- restrict: no se puede borrar una categoría que todavía tiene platos
  category_id  uuid not null references public.categories (id) on delete restrict,
  name         text not null check (char_length(name) between 1 and 80),
  description  text check (char_length(description) <= 240),
  price        numeric(12, 2) check (price >= 0),
  price_cash   numeric(12, 2) check (price_cash >= 0),   -- pagando en efectivo o transferencia
  image_path   text,
  is_available boolean not null default true,   -- false = agotado
  is_visible   boolean not null default true,   -- false = oculto en el menú público
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_category_position_idx
  on public.products (category_id, position);

-- ------------------------------------------------------------
-- 5. Menú del día (cada plato pertenece a una fecha)
-- ------------------------------------------------------------
create table if not exists public.daily_menu_items (
  id           uuid primary key default gen_random_uuid(),
  menu_date    date not null,
  name         text not null check (char_length(name) between 1 and 80),
  description  text check (char_length(description) <= 240),
  price        numeric(12, 2) check (price >= 0),
  price_cash   numeric(12, 2) check (price_cash >= 0),
  image_path   text,
  is_available boolean not null default true,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists daily_menu_items_date_position_idx
  on public.daily_menu_items (menu_date, position);

-- ------------------------------------------------------------
-- 6. Slug de las categorías
--    "Sándwiches" → "sandwiches". Se genera al crear la categoría y no
--    cambia al renombrarla, así los links que ya circulan siguen andando.
--    Si se repite, se agrega un número: "pollo-2".
-- ------------------------------------------------------------
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        lower(translate(
          value,
          'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç',
          'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc'
        )),
        '[^a-z0-9]+', '-', 'g'
      )),
      ''
    ),
    'categoria'
  );
$$;

create or replace function public.categories_set_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base      text;
  candidate text;
  n         integer := 1;
begin
  -- Slug explícito (por ejemplo desde seed-carta.sql): se normaliza y listo.
  -- Si choca con otro, salta el índice único (o el "on conflict" de quien inserta).
  if nullif(trim(new.slug), '') is not null then
    if tg_op = 'INSERT' or new.slug is distinct from old.slug then
      new.slug := public.slugify(new.slug);
    end if;
    return new;
  end if;

  -- Sin slug: se genera desde el nombre y se numera si ya existe
  base := public.slugify(new.name);
  candidate := base;
  while exists (select 1 from public.categories c where c.slug = candidate and c.id <> new.id) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists categories_slug on public.categories;
create trigger categories_slug before insert or update of slug on public.categories
  for each row execute function public.categories_set_slug();

-- ------------------------------------------------------------
-- 7. updated_at automático
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 8. RLS: el público solo lee, el staff edita
-- ------------------------------------------------------------
alter table public.settings         enable row level security;
alter table public.opening_hours    enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.daily_menu_items enable row level security;

-- settings
drop policy if exists "settings: lectura pública" on public.settings;
create policy "settings: lectura pública" on public.settings
  for select to anon, authenticated using (true);
drop policy if exists "settings: staff edita" on public.settings;
create policy "settings: staff edita" on public.settings
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- opening_hours
drop policy if exists "horarios: lectura pública" on public.opening_hours;
create policy "horarios: lectura pública" on public.opening_hours
  for select to anon, authenticated using (true);
drop policy if exists "horarios: staff edita" on public.opening_hours;
create policy "horarios: staff edita" on public.opening_hours
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- categories
drop policy if exists "categorías: lectura pública" on public.categories;
create policy "categorías: lectura pública" on public.categories
  for select to anon, authenticated using (is_visible or (select public.is_staff()));
drop policy if exists "categorías: staff edita" on public.categories;
create policy "categorías: staff edita" on public.categories
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- products
drop policy if exists "productos: lectura pública" on public.products;
create policy "productos: lectura pública" on public.products
  for select to anon, authenticated using (is_visible or (select public.is_staff()));
drop policy if exists "productos: staff edita" on public.products;
create policy "productos: staff edita" on public.products
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- daily_menu_items
drop policy if exists "menú del día: lectura pública" on public.daily_menu_items;
create policy "menú del día: lectura pública" on public.daily_menu_items
  for select to anon, authenticated using (true);
drop policy if exists "menú del día: staff edita" on public.daily_menu_items;
create policy "menú del día: staff edita" on public.daily_menu_items
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ------------------------------------------------------------
-- 9. Storage: fotos de los platos y de las categorías
--    Bucket público (lectura por URL), escritura solo staff.
--    El panel comprime las fotos a ~1200 px en WebP/JPEG antes de subir.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('platos', 'platos', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "platos: staff lista" on storage.objects;
create policy "platos: staff lista" on storage.objects
  for select to authenticated
  using (bucket_id = 'platos' and (select public.is_staff()));

drop policy if exists "platos: staff sube" on storage.objects;
create policy "platos: staff sube" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'platos' and (select public.is_staff()));

drop policy if exists "platos: staff reemplaza" on storage.objects;
create policy "platos: staff reemplaza" on storage.objects
  for update to authenticated
  using (bucket_id = 'platos' and (select public.is_staff()));

drop policy if exists "platos: staff borra" on storage.objects;
create policy "platos: staff borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'platos' and (select public.is_staff()));

-- ------------------------------------------------------------
-- 10. Filas base (idempotente)
-- ------------------------------------------------------------
insert into public.settings (id) values (1) on conflict (id) do nothing;

insert into public.opening_hours (weekday, is_open, opens_at, closes_at) values
  (0, false, '10:00', '15:30'),  -- domingo cerrado
  (1, true,  '10:00', '15:30'),
  (2, true,  '10:00', '15:30'),
  (3, true,  '10:00', '15:30'),
  (4, true,  '10:00', '15:30'),
  (5, true,  '10:00', '15:30'),
  (6, true,  '10:00', '15:30')
on conflict (weekday) do nothing;

-- ------------------------------------------------------------
-- 11. Dar acceso al panel
--     Primero creá el usuario en Authentication > Users > Add user
--     (con "Auto Confirm User" tildado). Después corré esto con su email:
-- ------------------------------------------------------------
-- insert into public.staff (user_id, name)
-- select id, 'Encargada' from auth.users where email = 'encargada@ejemplo.com'
-- on conflict (user_id) do nothing;
