// La carta real del local, sacada del PDF (sin precios: el PDF no los trae).
// Es la fuente de supabase/seed-carta.sql: si cambia acá, regenerar el SQL (y al revés).
// Sin imports a propósito, para poder leerla también desde un script de Node.

export type CartaDish = [name: string, description?: string | null];
export type CartaCategory = { name: string; slug: string; dishes: CartaDish[] };

const GUARNICION = 'Con guarnición.';
const SORRENTINOS = 'De jamón y queso.';
const ENSALADA = 'Porción para una persona.';
const SANDWICH = 'Lechuga, tomate, huevo y mayonesa.';
const SANDWICH_COMPLETO = 'Lechuga, tomate, huevo y mayonesa. Con papas fritas.';

export const CARTA: CartaCategory[] = [
  {
    name: 'Pastas caseras',
    slug: 'pastas-caseras',
    dishes: [
      ['Ñoquis con salsa y queso'],
      ['Ñoquis con crema y queso'],
      ['Ñoquis con salsa bolognesa y queso'],
      ['Ñoquis con peceto, salsa y queso'],
      ['Tallarines con salsa y queso'],
      ['Tallarines con crema y queso'],
      ['Tallarines con bolognesa y queso'],
      ['Tallarines con peceto, salsa y queso'],
      ['Ravioles con salsa y queso'],
      ['Ravioles con crema y queso'],
      ['Ravioles con bolognesa y queso'],
      ['Ravioles con peceto, salsa y queso'],
      ['Canelones con salsa y queso'],
      ['Canelones con crema y queso'],
      ['Canelones con bolognesa y queso'],
      ['Canelones con peceto, salsa y queso'],
      ['Sorrentinos con salsa y queso', SORRENTINOS],
      ['Sorrentinos con crema y queso', SORRENTINOS],
      ['Sorrentinos con bolognesa', SORRENTINOS],
      ['Sorrentinos con peceto, salsa y queso', SORRENTINOS],
      ['Adicional queso rallado'],
      ['Adicional crema'],
    ],
  },
  {
    name: 'Pollo',
    slug: 'pollo',
    dishes: [
      ['Pollo al horno (pata muslo)', 'Al limón y/o condimentado, con guarnición.'],
      ['Pollo al verdeo', GUARNICION],
      ['Pollo deshuesado a la plancha', GUARNICION],
      ['Pechugas de pollo al oreganato o provenzal', GUARNICION],
    ],
  },
  {
    name: 'Ensaladas',
    slug: 'ensaladas',
    dishes: [
      ['Ensalada mixta', `Lechuga, tomate y cebolla. ${ENSALADA}`],
      ['Ensalada de remolacha y huevo', ENSALADA],
      ['Ensalada de tomate y cebolla', ENSALADA],
      ['Ensalada completa', `Lechuga, tomate, cebolla, zanahoria, remolacha y huevo. ${ENSALADA}`],
      ['Ensalada rusa (porción)'],
      ['Ensalada rusa (por kilo)'],
    ],
  },
  {
    name: 'Carnes',
    slug: 'carnes',
    dishes: [
      ['Costeletas', GUARNICION],
      ['Costeletas con salsa criolla', GUARNICION],
      ['Costeletas de cerdo a la provenzal', GUARNICION],
      ['Costeletas de cerdo con crema de mostaza', GUARNICION],
      ['Peceto a la provenzal', GUARNICION],
      ['Matambre a la pizza', GUARNICION],
      ['Matambre tiernizado', GUARNICION],
      ['Hamburguesas caseras al plato con muzzarella', '2 unidades, con guarnición.'],
      ['Hamburguesas caseras al plato napolitanas', '2 unidades, con guarnición.'],
      ['Lomito salteado al plato'],
    ],
  },
  {
    name: 'Milanesas',
    slug: 'milanesas',
    dishes: [
      ['Milanesa de ternera con guarnición'],
      ['Milanesa de ternera sin guarnición'],
      ['Milanesa de ternera napolitana'],
      ['Milanesa de ternera supernapolitana'],
      ['Milanesa de pollo con guarnición'],
    ],
  },
  {
    name: 'Sándwiches',
    slug: 'sandwiches',
    dishes: [
      ['Sándwich de milanesa de ternera simple', SANDWICH],
      ['Sándwich de milanesa de ternera completo', SANDWICH_COMPLETO],
      ['Sándwich de milanesa de pollo simple', SANDWICH],
      ['Sándwich de milanesa de pollo completo', SANDWICH_COMPLETO],
    ],
  },
  {
    name: 'Empanadas',
    slug: 'empanadas',
    dishes: [
      ['Empanada árabe (unidad)'],
      ['Empanada árabe (docena)'],
      ['Empanada criolla al horno (unidad)'],
      ['Empanada criolla al horno (docena)'],
      ['Empanada criolla frita (unidad)'],
      ['Empanada criolla frita (docena)'],
    ],
  },
  {
    name: 'Otros platos',
    slug: 'otros-platos',
    dishes: [
      ['Papas fritas tamaño 105'],
      ['Papas fritas tamaño 102'],
      ['Pizzetas caseras de muzzarella'],
      ['Omelette de jamón y queso con papas'],
      ['Tortilla de papa chica'],
      ['Tortilla de papa grande'],
      ['Huevo frito (unidad)'],
    ],
  },
  {
    name: 'Bebidas',
    slug: 'bebidas',
    dishes: [
      ['Gaseosa 350 ml'],
      ['Gaseosa ½ litro'],
      ['Gaseosa de vidrio 1¼ litro'],
      ['Gaseosa 1½ litro'],
      ['Cerveza en lata ½ litro'],
      ['Cerveza 1 litro', 'Brahma o Quilmes.'],
      ['Corona 1 litro'],
      ['Vino por vaso con hielo'],
      ['Vino ¾ blanco o tinto'],
      ['Vino Estancia Mendoza ¾ y otros'],
      ['Agua saborizada ½ litro'],
      ['Agua saborizada 1½ litro'],
      ['Power ½ litro'],
      ['Power 1 litro'],
      ['Agua mineral con o sin gas ½ litro'],
      ['Agua mineral con o sin gas 1½ litro'],
      ['Adicional hielo'],
    ],
  },
  {
    name: 'Postres',
    slug: 'postres',
    dishes: [
      ['Flan casero'],
      ['Flan casero con dulce de leche'],
      ['Flan casero con dulce de leche y crema'],
      ['Budín de pan'],
      ['Budín de pan con dulce de leche'],
      ['Budín de pan con dulce de leche y crema'],
      ['Queso y dulce de batata'],
      ['Borrachito con dulce de leche y crema'],
      ['Ensalada de fruta'],
      ['Gelatina'],
      ['Duraznos al natural'],
      ['Duraznos al natural con crema'],
      ['Adicional crema'],
      ['Adicional dulce de leche'],
    ],
  },
];
