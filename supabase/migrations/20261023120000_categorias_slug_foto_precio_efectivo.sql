-- ============================================================
-- Migración v2 · Rotisería Los Andes
-- Para bases creadas con la v1 de schema.sql (en una base nueva no hace falta:
-- schema.sql ya trae todo esto). Se puede correr más de una vez.
--
-- 1. categories.slug: URL de cada categoría (/carta/pastas-caseras), única.
-- 2. categories.image_path: foto de la tarjeta de la categoría.
-- 3. price_cash en products y daily_menu_items: precio en efectivo o transferencia.
-- ============================================================

begin;

-- 1. Columnas nuevas ------------------------------------------------------
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists image_path text;

alter table public.products
  add column if not exists price_cash numeric(12, 2) check (price_cash >= 0);
alter table public.daily_menu_items
  add column if not exists price_cash numeric(12, 2) check (price_cash >= 0);

-- 2. Generador de slugs (igual que en schema.sql) -------------------------
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
  if nullif(trim(new.slug), '') is not null then
    if tg_op = 'INSERT' or new.slug is distinct from old.slug then
      new.slug := public.slugify(new.slug);
    end if;
    return new;
  end if;

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

-- 3. Slug para las categorías que ya existían -----------------------------
--    De a una y en el orden de la carta: si dos se llaman igual, la primera
--    queda "pollo" y la segunda "pollo-2". El trigger hace el trabajo.
do $$
declare
  r record;
begin
  for r in
    select id from public.categories
    where slug is null or trim(slug) = ''
    order by position, created_at
  loop
    update public.categories set slug = '' where id = r.id;
  end loop;
end;
$$;

alter table public.categories alter column slug set not null;
create unique index if not exists categories_slug_key on public.categories (slug);

commit;
