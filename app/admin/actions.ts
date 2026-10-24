'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth';
import { IMAGE_BUCKET } from '@/lib/config';
import { cleanText } from '@/lib/format';
import { isIsoDate, todayIso } from '@/lib/hours';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, DishInput, OpeningHour } from '@/lib/types';

// Todas las acciones del panel. Cada una verifica que quien llama sea staff
// (además, RLS en Supabase bloquea cualquier escritura de alguien que no lo sea).

type DB = Awaited<ReturnType<typeof createClient>>;
type Direction = 'up' | 'down';

const SESSION_ERROR = 'Tu sesión se cerró. Volvé a entrar al panel.';
const SAVE_ERROR = 'No se pudo guardar. Revisá la conexión y probá de nuevo.';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_PATH = /^[\w-]+\.(webp|jpg|jpeg|png)$/;

async function staffClient(): Promise<DB | null> {
  const { supabase, user, isStaff } = await getStaffSession();
  return user && isStaff ? supabase : null;
}

function ok(message?: string): ActionResult {
  revalidatePath('/', 'layout');
  return { ok: true, message };
}

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function dbFail(error: { message: string } | null, fallback = SAVE_ERROR): ActionResult {
  if (error) console.error('[panel]', error.message);
  return fail(fallback);
}

// ------------------------------------------------------------
// Validaciones
// ------------------------------------------------------------

type DishRow = {
  name: string;
  description: string | null;
  price: number | null;
  price_cash: number | null;
  image_path: string | null;
  is_available: boolean;
};

/** undefined/null = sin precio · NaN = precio inválido */
function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return NaN;
  return Math.round(n * 100) / 100;
}

function parseDish(input: DishInput): { row: DishRow } | { error: string } {
  const name = cleanText(input.name, 80);
  if (!name) return { error: 'Escribí el nombre del plato.' };

  const price = parseMoney(input.price);
  if (Number.isNaN(price)) return { error: 'Revisá el precio.' };
  const price_cash = parseMoney(input.price_cash);
  if (Number.isNaN(price_cash)) return { error: 'Revisá el precio en efectivo o transferencia.' };

  return {
    row: {
      name,
      description: cleanText(input.description, 240),
      price,
      price_cash,
      image_path: validImagePath(input.image_path),
      is_available: input.is_available !== false,
    },
  };
}

function validImagePath(value: unknown): string | null {
  return typeof value === 'string' && IMAGE_PATH.test(value) ? value : null;
}

// ------------------------------------------------------------
// Utilidades compartidas
// ------------------------------------------------------------

/** Borra la foto del Storage solo si nadie la usa (el menú copiado comparte fotos). */
async function removeImageIfUnused(db: DB, path: string | null | undefined) {
  if (!path || !IMAGE_PATH.test(path)) return;
  const [products, daily, categories] = await Promise.all([
    db.from('products').select('id', { count: 'exact', head: true }).eq('image_path', path),
    db.from('daily_menu_items').select('id', { count: 'exact', head: true }).eq('image_path', path),
    db.from('categories').select('id', { count: 'exact', head: true }).eq('image_path', path),
  ]);
  if (products.error || daily.error || categories.error) return;
  if ((products.count ?? 0) + (daily.count ?? 0) + (categories.count ?? 0) === 0) {
    await db.storage.from(IMAGE_BUCKET).remove([path]);
  }
}

type Table = 'categories' | 'products' | 'daily_menu_items';
type Scope = { column: 'category_id' | 'menu_date'; value: string } | null;

async function nextPosition(db: DB, table: Table, scope: Scope): Promise<number> {
  let query = db.from(table).select('position').order('position', { ascending: false }).limit(1);
  if (scope) query = query.eq(scope.column, scope.value);
  const { data } = await query;
  const last = (data as { position: number }[] | null)?.[0]?.position;
  return typeof last === 'number' ? last + 1 : 0;
}

/** Sube o baja un elemento dentro de su lista y renumera posiciones 0..n. */
async function moveInList(db: DB, table: Table, scope: Scope, id: string, direction: Direction) {
  let query = db.from(table).select('id').order('position').order('created_at');
  if (scope) query = query.eq(scope.column, scope.value);
  const { data, error } = await query;
  if (error || !data) return dbFail(error);

  const ids = (data as { id: string }[]).map((r) => r.id);
  const from = ids.indexOf(id);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return ok();

  [ids[from], ids[to]] = [ids[to], ids[from]];
  const results = await Promise.all(
    ids.map((rowId, position) => db.from(table).update({ position }).eq('id', rowId)),
  );
  const failed = results.find((r) => r.error);
  return failed ? dbFail(failed.error) : ok();
}

// ------------------------------------------------------------
// Sesión
// ------------------------------------------------------------

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Completá el email y la contraseña.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'El email o la contraseña no coinciden. Revisalos y probá de nuevo.' };

  redirect('/admin');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

// ------------------------------------------------------------
// Fotos
// ------------------------------------------------------------

/** Se llama al cancelar un formulario con una foto recién subida que no se usó. */
export async function discardUpload(path: string): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  await removeImageIfUnused(db, path);
  return { ok: true };
}

// ------------------------------------------------------------
// Menú del día
// ------------------------------------------------------------

export async function saveDailyItem(date: string, input: DishInput): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!isIsoDate(date)) return fail('La fecha no es válida.');

  const parsed = parseDish(input);
  if ('error' in parsed) return fail(parsed.error);

  if (input.id) {
    if (!UUID.test(input.id)) return fail('No se encontró el plato.');
    const { data: before } = await db
      .from('daily_menu_items')
      .select('image_path')
      .eq('id', input.id)
      .maybeSingle();
    const { error } = await db.from('daily_menu_items').update(parsed.row).eq('id', input.id);
    if (error) return dbFail(error);
    if (before?.image_path && before.image_path !== parsed.row.image_path) {
      await removeImageIfUnused(db, before.image_path);
    }
    return ok('Cambios guardados');
  }

  const position = await nextPosition(db, 'daily_menu_items', { column: 'menu_date', value: date });
  const { error } = await db.from('daily_menu_items').insert({ ...parsed.row, menu_date: date, position });
  return error ? dbFail(error) : ok('Plato agregado');
}

export async function setDailyItemAvailable(id: string, available: boolean): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { error } = await db.from('daily_menu_items').update({ is_available: available }).eq('id', id);
  return error ? dbFail(error) : ok(available ? 'Marcado como disponible' : 'Marcado como agotado');
}

export async function moveDailyItem(id: string, direction: Direction): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { data } = await db.from('daily_menu_items').select('menu_date').eq('id', id).maybeSingle();
  if (!data) return fail('No se encontró el plato.');
  return moveInList(db, 'daily_menu_items', { column: 'menu_date', value: data.menu_date }, id, direction);
}

export async function deleteDailyItem(id: string): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { data, error } = await db
    .from('daily_menu_items')
    .delete()
    .eq('id', id)
    .select('image_path')
    .maybeSingle();
  if (error) return dbFail(error, 'No se pudo borrar. Probá de nuevo.');
  await removeImageIfUnused(db, data?.image_path);
  return ok('Plato borrado');
}

/** Copia todos los platos de un día a otro (para no cargar de cero lo que se repite). */
export async function copyDailyMenu(fromDate: string, toDate: string): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!isIsoDate(fromDate) || !isIsoDate(toDate)) return fail('La fecha no es válida.');

  const { data, error } = await db
    .from('daily_menu_items')
    .select('name, description, price, price_cash, image_path')
    .eq('menu_date', fromDate)
    .order('position')
    .order('created_at');
  if (error) return dbFail(error);
  if (!data?.length) return fail('Ese día no tiene platos para copiar.');

  const start = await nextPosition(db, 'daily_menu_items', { column: 'menu_date', value: toDate });
  const rows = data.map((item, i) => ({ ...item, menu_date: toDate, is_available: true, position: start + i }));
  const { error: insertError } = await db.from('daily_menu_items').insert(rows);
  if (insertError) return dbFail(insertError);
  return ok(rows.length === 1 ? 'Se copió 1 plato' : `Se copiaron ${rows.length} platos`);
}

// ------------------------------------------------------------
// Carta: categorías
// ------------------------------------------------------------

export async function saveCategory(input: { id?: string; name: string }): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  const name = cleanText(input.name, 60);
  if (!name) return fail('Escribí el nombre de la categoría.');

  if (input.id) {
    if (!UUID.test(input.id)) return fail('No se encontró la categoría.');
    const { error } = await db.from('categories').update({ name }).eq('id', input.id);
    return error ? dbFail(error) : ok('Nombre cambiado');
  }

  // El slug (la dirección /carta/...) lo genera la base desde el nombre
  const position = await nextPosition(db, 'categories', null);
  const { error } = await db.from('categories').insert({ name, position });
  return error ? dbFail(error) : ok('Categoría agregada');
}

/** Foto de la tarjeta de la categoría. path null = quitar la foto. */
export async function setCategoryImage(id: string, path: string | null): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró la categoría.');
  const image_path = validImagePath(path);
  if (path !== null && !image_path) return fail('La foto no es válida. Probá con otra.');

  const { data: before } = await db.from('categories').select('image_path').eq('id', id).maybeSingle();
  if (!before) return fail('No se encontró la categoría.');

  const { error } = await db.from('categories').update({ image_path }).eq('id', id);
  if (error) return dbFail(error);
  if (before.image_path && before.image_path !== image_path) {
    await removeImageIfUnused(db, before.image_path);
  }
  return ok(image_path ? 'Foto guardada' : 'Foto quitada');
}

export async function setCategoryVisible(id: string, visible: boolean): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró la categoría.');
  const { error } = await db.from('categories').update({ is_visible: visible }).eq('id', id);
  return error ? dbFail(error) : ok(visible ? 'La categoría se ve en el menú' : 'Categoría oculta');
}

export async function moveCategory(id: string, direction: Direction): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró la categoría.');
  return moveInList(db, 'categories', null, id, direction);
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró la categoría.');

  const { count } = await db
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if (count && count > 0) {
    return fail(
      count === 1
        ? 'Esta categoría tiene 1 plato. Borralo o pasalo a otra categoría primero.'
        : `Esta categoría tiene ${count} platos. Borralos o pasalos a otra categoría primero.`,
    );
  }

  const { data, error } = await db.from('categories').delete().eq('id', id).select('image_path').maybeSingle();
  if (error) return dbFail(error, 'No se pudo borrar. Probá de nuevo.');
  await removeImageIfUnused(db, data?.image_path);
  return ok('Categoría borrada');
}

// ------------------------------------------------------------
// Carta: platos
// ------------------------------------------------------------

export async function saveProduct(input: DishInput & { category_id: string }): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(input.category_id)) return fail('Elegí una categoría.');

  const parsed = parseDish(input);
  if ('error' in parsed) return fail(parsed.error);

  if (input.id) {
    if (!UUID.test(input.id)) return fail('No se encontró el plato.');
    const { data: before } = await db
      .from('products')
      .select('image_path, category_id')
      .eq('id', input.id)
      .maybeSingle();
    if (!before) return fail('No se encontró el plato.');

    const changes: Record<string, unknown> = { ...parsed.row, category_id: input.category_id };
    if (before.category_id !== input.category_id) {
      // Si cambia de categoría, va al final de la nueva
      changes.position = await nextPosition(db, 'products', { column: 'category_id', value: input.category_id });
    }
    const { error } = await db.from('products').update(changes).eq('id', input.id);
    if (error) return dbFail(error);
    if (before.image_path && before.image_path !== parsed.row.image_path) {
      await removeImageIfUnused(db, before.image_path);
    }
    return ok('Cambios guardados');
  }

  const position = await nextPosition(db, 'products', { column: 'category_id', value: input.category_id });
  const { error } = await db
    .from('products')
    .insert({ ...parsed.row, category_id: input.category_id, position });
  return error ? dbFail(error) : ok('Plato agregado');
}

export async function setProductAvailable(id: string, available: boolean): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { error } = await db.from('products').update({ is_available: available }).eq('id', id);
  return error ? dbFail(error) : ok(available ? 'Marcado como disponible' : 'Marcado como agotado');
}

export async function setProductVisible(id: string, visible: boolean): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { error } = await db.from('products').update({ is_visible: visible }).eq('id', id);
  return error ? dbFail(error) : ok(visible ? 'El plato se ve en el menú' : 'Plato oculto');
}

export async function moveProduct(id: string, direction: Direction): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { data } = await db.from('products').select('category_id').eq('id', id).maybeSingle();
  if (!data) return fail('No se encontró el plato.');
  return moveInList(db, 'products', { column: 'category_id', value: data.category_id }, id, direction);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!UUID.test(id)) return fail('No se encontró el plato.');
  const { data, error } = await db.from('products').delete().eq('id', id).select('image_path').maybeSingle();
  if (error) return dbFail(error, 'No se pudo borrar. Probá de nuevo.');
  await removeImageIfUnused(db, data?.image_path);
  return ok('Plato borrado');
}

/** Guarda varios precios de una vez (pantalla "Precios"): precio y precio en efectivo de cada plato. */
export async function savePrices(
  updates: { id: string; price: number | null; price_cash: number | null }[],
): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!Array.isArray(updates) || updates.length === 0) return fail('No hay precios para guardar.');
  if (updates.length > 500) return fail('Son demasiados cambios juntos.');

  const rows: { id: string; price: number | null; price_cash: number | null }[] = [];
  for (const u of updates) {
    if (!UUID.test(u.id)) return fail('Hay un plato que no se encontró. Recargá la página.');
    const price = parseMoney(u.price);
    const price_cash = parseMoney(u.price_cash);
    if (Number.isNaN(price) || Number.isNaN(price_cash)) return fail('Hay un precio que no es válido.');
    rows.push({ id: u.id, price, price_cash });
  }

  const results = await Promise.all(
    rows.map(({ id, price, price_cash }) => db.from('products').update({ price, price_cash }).eq('id', id)),
  );
  const failed = results.filter((r) => r.error);
  if (failed.length) {
    return dbFail(failed[0].error, `No se pudieron guardar ${failed.length} platos. Probá de nuevo.`);
  }
  return ok(rows.length === 1 ? 'Precio guardado' : `Precios de ${rows.length} platos guardados`);
}

// ------------------------------------------------------------
// Local: datos, horarios y cierre
// ------------------------------------------------------------

export async function saveSettings(input: {
  business_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
}): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);

  const business_name = cleanText(input.business_name, 60);
  if (!business_name) return fail('Escribí el nombre del local.');

  const whatsappDigits = String(input.whatsapp ?? '').replace(/\D/g, '');
  if (whatsappDigits && (whatsappDigits.length < 8 || whatsappDigits.length > 15)) {
    return fail('El WhatsApp tiene que tener entre 8 y 15 números. Ejemplo: 5493543412345');
  }

  const { error } = await db
    .from('settings')
    .update({
      business_name,
      tagline: cleanText(input.tagline, 80),
      phone: cleanText(input.phone, 30),
      whatsapp: whatsappDigits || null,
      address: cleanText(input.address, 120),
    })
    .eq('id', 1);
  return error ? dbFail(error) : ok('Datos guardados');
}

export async function saveHours(rows: OpeningHour[]): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!Array.isArray(rows) || rows.length !== 7) return fail('Faltan días en los horarios.');

  const time = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  for (const r of rows) {
    if (!Number.isInteger(r.weekday) || r.weekday < 0 || r.weekday > 6) return fail('Hay un día no válido.');
    if (!time.test(r.opens_at) || !time.test(r.closes_at)) return fail('Revisá los horarios: usá el formato 10:00.');
    if (r.is_open && r.closes_at.slice(0, 5) <= r.opens_at.slice(0, 5)) {
      return fail('En cada día abierto, la hora de cierre tiene que ser después de la de apertura.');
    }
  }

  const { error } = await db.from('opening_hours').upsert(
    rows.map((r) => ({
      weekday: r.weekday,
      is_open: Boolean(r.is_open),
      opens_at: r.opens_at,
      closes_at: r.closes_at.slice(0, 5) > r.opens_at.slice(0, 5) ? r.closes_at : '23:59',
    })),
  );
  return error ? dbFail(error) : ok('Horarios guardados');
}

export async function closeStore(input: { until: string; message: string }): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  if (!isIsoDate(input.until)) return fail('Elegí hasta qué día está cerrado.');
  if (input.until < todayIso()) return fail('Elegí hoy o un día que todavía no pasó.');

  const { error } = await db
    .from('settings')
    .update({ closed_until: input.until, closed_message: cleanText(input.message, 160) })
    .eq('id', 1);
  return error ? dbFail(error) : ok('Listo: el menú muestra que está cerrado');
}

export async function reopenStore(): Promise<ActionResult> {
  const db = await staffClient();
  if (!db) return fail(SESSION_ERROR);
  const { error } = await db
    .from('settings')
    .update({ closed_until: null, closed_message: null })
    .eq('id', 1);
  return error ? dbFail(error) : ok('Listo: el local vuelve a figurar con su horario normal');
}
