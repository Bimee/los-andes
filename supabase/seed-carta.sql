-- ============================================================
-- Carta real de la Rotisería Los Andes (sacada del PDF del local)
-- Correr DESPUÉS de schema.sql (y de supabase/migrations/ si la base es de la v1).
--
-- Se puede correr más de una vez:
--   · no duplica categorías ni platos (las categorías se reconocen por el slug
--     y los platos por categoría + nombre);
--   · no toca nada de lo que ya esté cargado: precios, fotos, agotados,
--     ocultos, descripciones, orden ni nombres editados desde el panel;
--   · si encuentra la carta de ejemplo de la v1 (el viejo seed.sql), la borra.
--   Ojo: un plato borrado desde el panel vuelve a aparecer si se corre de nuevo.
--
-- El PDF no trae precios: todos los platos quedan sin precio. Se cargan
-- desde el panel, en Precios.
-- ============================================================

begin;

-- 1. Datos del local --------------------------------------------------------
--    Solo completa lo que está vacío o lo que quedó de la carta de ejemplo.
update public.settings set
  tagline  = case when coalesce(tagline, '') in ('', 'Rotisería en La Calera')
                  then 'Rotisería · comida casera' else tagline end,
  phone    = case when coalesce(phone, '') in ('', '03543 00-0000')
                  then '351 636-0127' else phone end,
  whatsapp = case when coalesce(whatsapp, '') in ('', '5493543000000')
                  then '5493516360127' else whatsapp end,
  address  = case when coalesce(address, '') in ('', 'Dirección del local, La Calera')
                  then 'Ruta E-55 esquina República, La Calera' else address end
where id = 1;

-- 2. Carta de ejemplo de la v1 ------------------------------------------------
--    Se borra solo si sigue cargada ("Docena surtida / Elegí los gustos" no
--    existe en la carta real). Cada plato se reconoce por categoría, nombre y
--    precio de ejemplo, así no se lleva puesto nada cargado a mano.
do $$
begin
  if not exists (
    select 1 from public.products
    where name = 'Docena surtida' and description = 'Elegí los gustos'
  ) then
    return;
  end if;

  delete from public.products p
  using public.categories c,
    (values
      ('Minutas',      'Milanesa de carne',         9500),
      ('Minutas',      'Milanesa napolitana',       11500),
      ('Minutas',      'Suprema de pollo',          9000),
      ('Pollo',        'Pollo al spiedo entero',    14000),
      ('Pollo',        'Medio pollo al spiedo',     7500),
      ('Pastas',       'Ravioles de verdura',       8500),
      ('Pastas',       'Ñoquis de papa',            7800),
      ('Pastas',       'Lasaña de carne',           9800),
      ('Empanadas',    'Empanada de carne',         1600),
      ('Empanadas',    'Empanada de pollo',         1600),
      ('Empanadas',    'Empanada de jamón y queso', 1600),
      ('Empanadas',    'Docena surtida',            17500),
      ('Tartas',       'Tarta de jamón y queso',    4200),
      ('Tartas',       'Tarta de verdura',          4000),
      ('Guarniciones', 'Papas fritas',              4500),
      ('Guarniciones', 'Puré de papa',              3800),
      ('Guarniciones', 'Ensalada mixta',            3500),
      ('Postres',      'Flan casero',               3200),
      ('Postres',      'Budín de pan',              3000),
      ('Bebidas',      'Gaseosa 1,5 L',             3500),
      ('Bebidas',      'Agua sin gas 500 ml',       1500)
    ) as s(cat, name, price)
  where p.category_id = c.id and c.name = s.cat and p.name = s.name and p.price = s.price;

  -- Las categorías de ejemplo que quedaron vacías se borran: las reales se
  -- crean abajo con su orden.
  delete from public.categories c
  where c.name in ('Minutas', 'Pollo', 'Pastas', 'Empanadas', 'Tartas', 'Guarniciones', 'Postres', 'Bebidas')
    and not exists (select 1 from public.products p where p.category_id = c.id);

  delete from public.daily_menu_items d
  using (values
    ('Pollo al horno con papas', 'Cuarto de pollo con papas y batatas', 8900),
    ('Tallarines con tuco',      'Pasta casera con salsa de carne',     7900),
    ('Guiso de lentejas',        'Con chorizo colorado y panceta',      7500)
  ) as s(name, description, price)
  where d.name = s.name and d.description = s.description and d.price = s.price;
end;
$$;

-- 3. Categorías ------------------------------------------------------------
insert into public.categories (slug, name, position) values
  ('pastas-caseras', 'Pastas caseras', 0),
  ('pollo',          'Pollo',         1),
  ('ensaladas',      'Ensaladas',     2),
  ('carnes',         'Carnes',        3),
  ('milanesas',      'Milanesas',     4),
  ('sandwiches',     'Sándwiches',    5),
  ('empanadas',      'Empanadas',     6),
  ('otros-platos',   'Otros platos',  7),
  ('bebidas',        'Bebidas',       8),
  ('postres',        'Postres',       9)
on conflict (slug) do nothing;

-- 4. Platos (sin precio) ---------------------------------------------------
insert into public.products (category_id, name, description, position)
select c.id, d.name, d.description, d.position
from (values
  ('pastas-caseras',  0, 'Ñoquis con salsa y queso', null),
  ('pastas-caseras',  1, 'Ñoquis con crema y queso', null),
  ('pastas-caseras',  2, 'Ñoquis con salsa bolognesa y queso', null),
  ('pastas-caseras',  3, 'Ñoquis con peceto, salsa y queso', null),
  ('pastas-caseras',  4, 'Tallarines con salsa y queso', null),
  ('pastas-caseras',  5, 'Tallarines con crema y queso', null),
  ('pastas-caseras',  6, 'Tallarines con bolognesa y queso', null),
  ('pastas-caseras',  7, 'Tallarines con peceto, salsa y queso', null),
  ('pastas-caseras',  8, 'Ravioles con salsa y queso', null),
  ('pastas-caseras',  9, 'Ravioles con crema y queso', null),
  ('pastas-caseras', 10, 'Ravioles con bolognesa y queso', null),
  ('pastas-caseras', 11, 'Ravioles con peceto, salsa y queso', null),
  ('pastas-caseras', 12, 'Canelones con salsa y queso', null),
  ('pastas-caseras', 13, 'Canelones con crema y queso', null),
  ('pastas-caseras', 14, 'Canelones con bolognesa y queso', null),
  ('pastas-caseras', 15, 'Canelones con peceto, salsa y queso', null),
  ('pastas-caseras', 16, 'Sorrentinos con salsa y queso', 'De jamón y queso.'),
  ('pastas-caseras', 17, 'Sorrentinos con crema y queso', 'De jamón y queso.'),
  ('pastas-caseras', 18, 'Sorrentinos con bolognesa', 'De jamón y queso.'),
  ('pastas-caseras', 19, 'Sorrentinos con peceto, salsa y queso', 'De jamón y queso.'),
  ('pastas-caseras', 20, 'Adicional queso rallado', null),
  ('pastas-caseras', 21, 'Adicional crema', null),
  ('pollo',           0, 'Pollo al horno (pata muslo)', 'Al limón y/o condimentado, con guarnición.'),
  ('pollo',           1, 'Pollo al verdeo', 'Con guarnición.'),
  ('pollo',           2, 'Pollo deshuesado a la plancha', 'Con guarnición.'),
  ('pollo',           3, 'Pechugas de pollo al oreganato o provenzal', 'Con guarnición.'),
  ('ensaladas',       0, 'Ensalada mixta', 'Lechuga, tomate y cebolla. Porción para una persona.'),
  ('ensaladas',       1, 'Ensalada de remolacha y huevo', 'Porción para una persona.'),
  ('ensaladas',       2, 'Ensalada de tomate y cebolla', 'Porción para una persona.'),
  ('ensaladas',       3, 'Ensalada completa', 'Lechuga, tomate, cebolla, zanahoria, remolacha y huevo. Porción para una persona.'),
  ('ensaladas',       4, 'Ensalada rusa (porción)', null),
  ('ensaladas',       5, 'Ensalada rusa (por kilo)', null),
  ('carnes',          0, 'Costeletas', 'Con guarnición.'),
  ('carnes',          1, 'Costeletas con salsa criolla', 'Con guarnición.'),
  ('carnes',          2, 'Costeletas de cerdo a la provenzal', 'Con guarnición.'),
  ('carnes',          3, 'Costeletas de cerdo con crema de mostaza', 'Con guarnición.'),
  ('carnes',          4, 'Peceto a la provenzal', 'Con guarnición.'),
  ('carnes',          5, 'Matambre a la pizza', 'Con guarnición.'),
  ('carnes',          6, 'Matambre tiernizado', 'Con guarnición.'),
  ('carnes',          7, 'Hamburguesas caseras al plato con muzzarella', '2 unidades, con guarnición.'),
  ('carnes',          8, 'Hamburguesas caseras al plato napolitanas', '2 unidades, con guarnición.'),
  ('carnes',          9, 'Lomito salteado al plato', null),
  ('milanesas',       0, 'Milanesa de ternera con guarnición', null),
  ('milanesas',       1, 'Milanesa de ternera sin guarnición', null),
  ('milanesas',       2, 'Milanesa de ternera napolitana', null),
  ('milanesas',       3, 'Milanesa de ternera supernapolitana', null),
  ('milanesas',       4, 'Milanesa de pollo con guarnición', null),
  ('sandwiches',      0, 'Sándwich de milanesa de ternera simple', 'Lechuga, tomate, huevo y mayonesa.'),
  ('sandwiches',      1, 'Sándwich de milanesa de ternera completo', 'Lechuga, tomate, huevo y mayonesa. Con papas fritas.'),
  ('sandwiches',      2, 'Sándwich de milanesa de pollo simple', 'Lechuga, tomate, huevo y mayonesa.'),
  ('sandwiches',      3, 'Sándwich de milanesa de pollo completo', 'Lechuga, tomate, huevo y mayonesa. Con papas fritas.'),
  ('empanadas',       0, 'Empanada árabe (unidad)', null),
  ('empanadas',       1, 'Empanada árabe (docena)', null),
  ('empanadas',       2, 'Empanada criolla al horno (unidad)', null),
  ('empanadas',       3, 'Empanada criolla al horno (docena)', null),
  ('empanadas',       4, 'Empanada criolla frita (unidad)', null),
  ('empanadas',       5, 'Empanada criolla frita (docena)', null),
  ('otros-platos',    0, 'Papas fritas tamaño 105', null),
  ('otros-platos',    1, 'Papas fritas tamaño 102', null),
  ('otros-platos',    2, 'Pizzetas caseras de muzzarella', null),
  ('otros-platos',    3, 'Omelette de jamón y queso con papas', null),
  ('otros-platos',    4, 'Tortilla de papa chica', null),
  ('otros-platos',    5, 'Tortilla de papa grande', null),
  ('otros-platos',    6, 'Huevo frito (unidad)', null),
  ('bebidas',         0, 'Gaseosa 350 ml', null),
  ('bebidas',         1, 'Gaseosa ½ litro', null),
  ('bebidas',         2, 'Gaseosa de vidrio 1¼ litro', null),
  ('bebidas',         3, 'Gaseosa 1½ litro', null),
  ('bebidas',         4, 'Cerveza en lata ½ litro', null),
  ('bebidas',         5, 'Cerveza 1 litro', 'Brahma o Quilmes.'),
  ('bebidas',         6, 'Corona 1 litro', null),
  ('bebidas',         7, 'Vino por vaso con hielo', null),
  ('bebidas',         8, 'Vino ¾ blanco o tinto', null),
  ('bebidas',         9, 'Vino Estancia Mendoza ¾ y otros', null),
  ('bebidas',        10, 'Agua saborizada ½ litro', null),
  ('bebidas',        11, 'Agua saborizada 1½ litro', null),
  ('bebidas',        12, 'Power ½ litro', null),
  ('bebidas',        13, 'Power 1 litro', null),
  ('bebidas',        14, 'Agua mineral con o sin gas ½ litro', null),
  ('bebidas',        15, 'Agua mineral con o sin gas 1½ litro', null),
  ('bebidas',        16, 'Adicional hielo', null),
  ('postres',         0, 'Flan casero', null),
  ('postres',         1, 'Flan casero con dulce de leche', null),
  ('postres',         2, 'Flan casero con dulce de leche y crema', null),
  ('postres',         3, 'Budín de pan', null),
  ('postres',         4, 'Budín de pan con dulce de leche', null),
  ('postres',         5, 'Budín de pan con dulce de leche y crema', null),
  ('postres',         6, 'Queso y dulce de batata', null),
  ('postres',         7, 'Borrachito con dulce de leche y crema', null),
  ('postres',         8, 'Ensalada de fruta', null),
  ('postres',         9, 'Gelatina', null),
  ('postres',        10, 'Duraznos al natural', null),
  ('postres',        11, 'Duraznos al natural con crema', null),
  ('postres',        12, 'Adicional crema', null),
  ('postres',        13, 'Adicional dulce de leche', null)
) as d(slug, position, name, description)
join public.categories c on c.slug = d.slug
where not exists (
  select 1 from public.products p where p.category_id = c.id and p.name = d.name
);

commit;
