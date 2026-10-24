// MUESTRA: precios, descripciones y fotos inventados para ver el diseño completo en el modo demo.
// No son datos del local: solo se usan sin Supabase y nunca llegan a la base
// (supabase/seed-carta.sql se arma desde lib/carta.ts, que no los tiene).
// Fotos en public/muestra/, con licencias abiertas: ver public/muestra/CREDITOS.txt.

export type Foto =
  | 'noquis' | 'tallarines' | 'ravioles' | 'canelones' | 'sorrentinos' | 'queso-rallado' | 'crema'
  | 'pollo-horno' | 'pollo-plancha'
  | 'ensalada-mixta' | 'ensalada-remolacha' | 'ensalada-rusa'
  | 'costeletas' | 'cerdo' | 'peceto' | 'matambre' | 'hamburguesa' | 'lomito'
  | 'milanesa' | 'napolitana' | 'milanesa-pollo' | 'sandwich'
  | 'empanada-arabe' | 'empanada-horno' | 'empanada-frita'
  | 'papas-fritas' | 'pizzeta' | 'omelette' | 'tortilla' | 'huevo-frito'
  | 'gaseosa' | 'cerveza' | 'vino' | 'agua-saborizada' | 'agua' | 'hielo'
  | 'flan' | 'budin' | 'queso-dulce' | 'borrachito' | 'ensalada-fruta' | 'gelatina' | 'duraznos' | 'dulce-de-leche'
  | 'guiso';

type Muestra = {
  precio: number;
  desc: string;
  foto: Foto;
  /** Los adicionales tienen un solo precio (así figura en el PDF). */
  sinDescuento?: true;
};

export const fotoMuestra = (foto: Foto) => `/muestra/${foto}.webp`;

/** Precio en efectivo de muestra: 10 % menos, redondeado a $ 50 (igual que la herramienta del panel). */
export const efectivoMuestra = (precio: number) => Math.round((precio * 0.9) / 50) * 50;

/** Por nombre de plato (los de lib/carta.ts). */
export const MUESTRA: Record<string, Muestra> = {
  // Pastas caseras
  'Ñoquis con salsa y queso': { precio: 7800, foto: 'noquis', desc: 'Ñoquis de papa caseros con salsa de tomate y queso rallado.' },
  'Ñoquis con crema y queso': { precio: 8200, foto: 'noquis', desc: 'Ñoquis de papa caseros con salsa de crema y queso rallado.' },
  'Ñoquis con salsa bolognesa y queso': { precio: 8500, foto: 'noquis', desc: 'Ñoquis de papa con salsa bolognesa de carne y queso rallado.' },
  'Ñoquis con peceto, salsa y queso': { precio: 9200, foto: 'noquis', desc: 'Ñoquis de papa con peceto en su salsa y queso rallado.' },
  'Tallarines con salsa y queso': { precio: 7600, foto: 'tallarines', desc: 'Tallarines al huevo hechos en casa, con salsa de tomate y queso.' },
  'Tallarines con crema y queso': { precio: 8000, foto: 'tallarines', desc: 'Tallarines al huevo con salsa de crema y queso rallado.' },
  'Tallarines con bolognesa y queso': { precio: 8300, foto: 'tallarines', desc: 'Tallarines al huevo con salsa bolognesa y queso rallado.' },
  'Tallarines con peceto, salsa y queso': { precio: 9000, foto: 'tallarines', desc: 'Tallarines al huevo con peceto en su salsa y queso rallado.' },
  'Ravioles con salsa y queso': { precio: 8400, foto: 'ravioles', desc: 'Ravioles caseros de verdura y ricota con salsa de tomate y queso.' },
  'Ravioles con crema y queso': { precio: 8800, foto: 'ravioles', desc: 'Ravioles caseros con salsa de crema y queso rallado.' },
  'Ravioles con bolognesa y queso': { precio: 9100, foto: 'ravioles', desc: 'Ravioles caseros con salsa bolognesa y queso rallado.' },
  'Ravioles con peceto, salsa y queso': { precio: 9800, foto: 'ravioles', desc: 'Ravioles caseros con peceto en su salsa y queso rallado.' },
  'Canelones con salsa y queso': { precio: 8600, foto: 'canelones', desc: 'Canelones de verdura y ricota gratinados, con salsa de tomate.' },
  'Canelones con crema y queso': { precio: 9000, foto: 'canelones', desc: 'Canelones gratinados con salsa de crema y queso.' },
  'Canelones con bolognesa y queso': { precio: 9300, foto: 'canelones', desc: 'Canelones gratinados con salsa bolognesa y queso.' },
  'Canelones con peceto, salsa y queso': { precio: 10000, foto: 'canelones', desc: 'Canelones gratinados con peceto en su salsa y queso.' },
  'Sorrentinos con salsa y queso': { precio: 9200, foto: 'sorrentinos', desc: 'Sorrentinos de jamón y queso con salsa de tomate y queso rallado.' },
  'Sorrentinos con crema y queso': { precio: 9600, foto: 'sorrentinos', desc: 'Sorrentinos de jamón y queso con salsa de crema.' },
  'Sorrentinos con bolognesa': { precio: 9900, foto: 'sorrentinos', desc: 'Sorrentinos de jamón y queso con salsa bolognesa.' },
  'Sorrentinos con peceto, salsa y queso': { precio: 10600, foto: 'sorrentinos', desc: 'Sorrentinos de jamón y queso con peceto en su salsa.' },
  'Adicional queso rallado': { precio: 900, foto: 'queso-rallado', desc: 'Porción extra de queso rallado para tus pastas.', sinDescuento: true },
  'Adicional crema': { precio: 1000, foto: 'crema', desc: 'Porción extra de crema.', sinDescuento: true },

  // Pollo
  'Pollo al horno (pata muslo)': { precio: 9500, foto: 'pollo-horno', desc: 'Pata muslo al horno, al limón o condimentado, con guarnición.' },
  'Pollo al verdeo': { precio: 10200, foto: 'pollo-horno', desc: 'Pollo en salsa de verdeo y crema, con guarnición.' },
  'Pollo deshuesado a la plancha': { precio: 10500, foto: 'pollo-plancha', desc: 'Pollo sin hueso a la plancha, bien jugoso, con guarnición.' },
  'Pechugas de pollo al oreganato o provenzal': { precio: 10800, foto: 'pollo-plancha', desc: 'Pechuga a la plancha con orégano o ajo y perejil, con guarnición.' },

  // Ensaladas
  'Ensalada mixta': { precio: 4200, foto: 'ensalada-mixta', desc: 'Lechuga, tomate y cebolla. Porción para una persona.' },
  'Ensalada de remolacha y huevo': { precio: 4200, foto: 'ensalada-remolacha', desc: 'Remolacha cocida y huevo duro. Porción para una persona.' },
  'Ensalada de tomate y cebolla': { precio: 3800, foto: 'ensalada-mixta', desc: 'Tomate y cebolla en rodajas. Porción para una persona.' },
  'Ensalada completa': { precio: 5200, foto: 'ensalada-mixta', desc: 'Lechuga, tomate, cebolla, zanahoria, remolacha y huevo. Porción para una persona.' },
  'Ensalada rusa (porción)': { precio: 3500, foto: 'ensalada-rusa', desc: 'Papa, zanahoria, arvejas y mayonesa. Porción para una persona.' },
  'Ensalada rusa (por kilo)': { precio: 12000, foto: 'ensalada-rusa', desc: 'Papa, zanahoria, arvejas y mayonesa. Se vende por kilo.' },

  // Carnes
  'Costeletas': { precio: 11500, foto: 'costeletas', desc: 'Costeleta de ternera a la plancha, con guarnición.' },
  'Costeletas con salsa criolla': { precio: 12200, foto: 'costeletas', desc: 'Costeleta a la plancha con salsa criolla, con guarnición.' },
  'Costeletas de cerdo a la provenzal': { precio: 11800, foto: 'cerdo', desc: 'Costeleta de cerdo con ajo y perejil, con guarnición.' },
  'Costeletas de cerdo con crema de mostaza': { precio: 12400, foto: 'cerdo', desc: 'Costeleta de cerdo con salsa de crema y mostaza, con guarnición.' },
  'Peceto a la provenzal': { precio: 13500, foto: 'peceto', desc: 'Peceto en fetas finas con ajo y perejil, con guarnición.' },
  'Matambre a la pizza': { precio: 13800, foto: 'matambre', desc: 'Matambre tierno con salsa, muzzarella y orégano, con guarnición.' },
  'Matambre tiernizado': { precio: 12800, foto: 'matambre', desc: 'Matambre tiernizado a la plancha, con guarnición.' },
  'Hamburguesas caseras al plato con muzzarella': { precio: 10500, foto: 'hamburguesa', desc: 'Dos hamburguesas caseras con muzzarella, con guarnición.' },
  'Hamburguesas caseras al plato napolitanas': { precio: 11200, foto: 'hamburguesa', desc: 'Dos hamburguesas caseras con jamón, muzzarella y tomate, con guarnición.' },
  'Lomito salteado al plato': { precio: 14500, foto: 'lomito', desc: 'Tiras de lomo salteadas con cebolla y morrón.' },

  // Milanesas
  'Milanesa de ternera con guarnición': { precio: 11000, foto: 'milanesa', desc: 'Milanesa de ternera casera, con guarnición.' },
  'Milanesa de ternera sin guarnición': { precio: 8500, foto: 'milanesa', desc: 'Milanesa de ternera casera, sola.' },
  'Milanesa de ternera napolitana': { precio: 12500, foto: 'napolitana', desc: 'Milanesa de ternera con salsa, jamón y muzzarella gratinada.' },
  'Milanesa de ternera supernapolitana': { precio: 13900, foto: 'napolitana', desc: 'La napolitana con huevo frito y doble muzzarella.' },
  'Milanesa de pollo con guarnición': { precio: 10500, foto: 'milanesa-pollo', desc: 'Milanesa de pollo casera, con guarnición.' },

  // Sándwiches
  'Sándwich de milanesa de ternera simple': { precio: 8500, foto: 'sandwich', desc: 'Milanesa de ternera en pan francés con lechuga, tomate, huevo y mayonesa.' },
  'Sándwich de milanesa de ternera completo': { precio: 10500, foto: 'sandwich', desc: 'Milanesa de ternera, lechuga, tomate, huevo y mayonesa. Con papas fritas.' },
  'Sándwich de milanesa de pollo simple': { precio: 8000, foto: 'sandwich', desc: 'Milanesa de pollo en pan francés con lechuga, tomate, huevo y mayonesa.' },
  'Sándwich de milanesa de pollo completo': { precio: 10000, foto: 'sandwich', desc: 'Milanesa de pollo, lechuga, tomate, huevo y mayonesa. Con papas fritas.' },

  // Empanadas
  'Empanada árabe (unidad)': { precio: 1500, foto: 'empanada-arabe', desc: 'Empanada abierta de carne con limón, al estilo árabe.' },
  'Empanada árabe (docena)': { precio: 16500, foto: 'empanada-arabe', desc: 'Doce empanadas árabes de carne con limón.' },
  'Empanada criolla al horno (unidad)': { precio: 1500, foto: 'empanada-horno', desc: 'Carne cortada a cuchillo, huevo y aceituna, al horno.' },
  'Empanada criolla al horno (docena)': { precio: 16500, foto: 'empanada-horno', desc: 'Doce empanadas criollas al horno.' },
  'Empanada criolla frita (unidad)': { precio: 1600, foto: 'empanada-frita', desc: 'Carne cortada a cuchillo, huevo y aceituna, frita.' },
  'Empanada criolla frita (docena)': { precio: 17500, foto: 'empanada-frita', desc: 'Doce empanadas criollas fritas.' },

  // Otros platos
  'Papas fritas tamaño 105': { precio: 5500, foto: 'papas-fritas', desc: 'Papas fritas caseras, porción grande.' },
  'Papas fritas tamaño 102': { precio: 4200, foto: 'papas-fritas', desc: 'Papas fritas caseras, porción chica.' },
  'Pizzetas caseras de muzzarella': { precio: 6500, foto: 'pizzeta', desc: 'Pizzeta individual con salsa de tomate, muzzarella y orégano.' },
  'Omelette de jamón y queso con papas': { precio: 8500, foto: 'omelette', desc: 'Omelette de jamón y queso, acompañado con papas fritas.' },
  'Tortilla de papa chica': { precio: 7000, foto: 'tortilla', desc: 'Tortilla de papa casera, para una o dos personas.' },
  'Tortilla de papa grande': { precio: 12000, foto: 'tortilla', desc: 'Tortilla de papa casera, para compartir entre tres o cuatro.' },
  'Huevo frito (unidad)': { precio: 900, foto: 'huevo-frito', desc: 'Huevo frito para sumar a cualquier plato.' },

  // Bebidas
  'Gaseosa 350 ml': { precio: 1800, foto: 'gaseosa', desc: 'Lata o botellita de 350 ml. Consultá los sabores.' },
  'Gaseosa ½ litro': { precio: 2500, foto: 'gaseosa', desc: 'Botella de medio litro. Consultá los sabores.' },
  'Gaseosa de vidrio 1¼ litro': { precio: 4200, foto: 'gaseosa', desc: 'Botella de vidrio retornable de 1¼ litro.' },
  'Gaseosa 1½ litro': { precio: 4800, foto: 'gaseosa', desc: 'Botella de 1½ litro. Consultá los sabores.' },
  'Cerveza en lata ½ litro': { precio: 2800, foto: 'cerveza', desc: 'Lata de medio litro, bien fría.' },
  'Cerveza 1 litro': { precio: 5500, foto: 'cerveza', desc: 'Brahma o Quilmes, botella de un litro.' },
  'Corona 1 litro': { precio: 7500, foto: 'cerveza', desc: 'Corona, botella de un litro.' },
  'Vino por vaso con hielo': { precio: 2500, foto: 'vino', desc: 'Vaso de vino de la casa, con hielo.' },
  'Vino ¾ blanco o tinto': { precio: 7500, foto: 'vino', desc: 'Botella de ¾ de vino de la casa, blanco o tinto.' },
  'Vino Estancia Mendoza ¾ y otros': { precio: 9500, foto: 'vino', desc: 'Estancia Mendoza y otras etiquetas. Consultá cuáles hay.' },
  'Agua saborizada ½ litro': { precio: 2200, foto: 'agua-saborizada', desc: 'Medio litro. Consultá los sabores.' },
  'Agua saborizada 1½ litro': { precio: 3800, foto: 'agua-saborizada', desc: 'Botella de 1½ litro. Consultá los sabores.' },
  'Power ½ litro': { precio: 2600, foto: 'agua-saborizada', desc: 'Bebida deportiva, medio litro.' },
  'Power 1 litro': { precio: 4200, foto: 'agua-saborizada', desc: 'Bebida deportiva, un litro.' },
  'Agua mineral con o sin gas ½ litro': { precio: 1800, foto: 'agua', desc: 'Medio litro, con o sin gas.' },
  'Agua mineral con o sin gas 1½ litro': { precio: 3000, foto: 'agua', desc: 'Botella de 1½ litro, con o sin gas.' },
  'Adicional hielo': { precio: 800, foto: 'hielo', desc: 'Vaso con hielo para tu bebida.', sinDescuento: true },

  // Postres
  'Flan casero': { precio: 3200, foto: 'flan', desc: 'Flan casero con caramelo.' },
  'Flan casero con dulce de leche': { precio: 3800, foto: 'flan', desc: 'Flan casero con caramelo y dulce de leche.' },
  'Flan casero con dulce de leche y crema': { precio: 4300, foto: 'flan', desc: 'Flan casero con dulce de leche y crema batida.' },
  'Budín de pan': { precio: 3200, foto: 'budin', desc: 'Budín de pan casero con caramelo.' },
  'Budín de pan con dulce de leche': { precio: 3800, foto: 'budin', desc: 'Budín de pan casero con dulce de leche.' },
  'Budín de pan con dulce de leche y crema': { precio: 4300, foto: 'budin', desc: 'Budín de pan con dulce de leche y crema batida.' },
  'Queso y dulce de batata': { precio: 3800, foto: 'queso-dulce', desc: 'El clásico postre vigilante: queso fresco y dulce de batata.' },
  'Borrachito con dulce de leche y crema': { precio: 4500, foto: 'borrachito', desc: 'Bizcochuelo embebido, con dulce de leche y crema.' },
  'Ensalada de fruta': { precio: 3800, foto: 'ensalada-fruta', desc: 'Frutas de estación cortadas, en su jugo.' },
  'Gelatina': { precio: 2500, foto: 'gelatina', desc: 'Gelatina de frutas, porción individual.' },
  'Duraznos al natural': { precio: 3200, foto: 'duraznos', desc: 'Duraznos en almíbar.' },
  'Duraznos al natural con crema': { precio: 3800, foto: 'duraznos', desc: 'Duraznos en almíbar con crema batida.' },
  'Adicional dulce de leche': { precio: 1000, foto: 'dulce-de-leche', desc: 'Porción extra de dulce de leche.', sinDescuento: true },
};

/** Foto de muestra de cada categoría (por slug). */
export const FOTO_CATEGORIA: Record<string, Foto> = {
  'pastas-caseras': 'ravioles',
  pollo: 'pollo-horno',
  ensaladas: 'ensalada-mixta',
  carnes: 'matambre',
  milanesas: 'milanesa',
  sandwiches: 'sandwich',
  empanadas: 'empanada-horno',
  'otros-platos': 'papas-fritas',
  bebidas: 'cerveza',
  postres: 'flan',
};
