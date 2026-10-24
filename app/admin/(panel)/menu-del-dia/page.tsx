import { DailyMenuManager } from '@/components/admin/DailyMenuManager';
import { getDailyItems, getPreviousMenuDate } from '@/lib/admin-data';
import { requireStaff } from '@/lib/auth';
import { isIsoDate, todayIso } from '@/lib/hours';

type Props = { searchParams: Promise<{ fecha?: string | string[] }> };

export default async function DailyMenuPage({ searchParams }: Props) {
  const db = await requireStaff();
  const today = todayIso();
  const { fecha } = await searchParams;
  const date = typeof fecha === 'string' && isIsoDate(fecha) ? fecha : today;

  const [items, copySource] = await Promise.all([getDailyItems(db, date), getPreviousMenuDate(db, date)]);

  return (
    <>
      <h1 className="admin-title">Menú del día</h1>
      <p className="admin-lead">Cargá los platos de cada día. El de mañana lo podés dejar listo desde hoy.</p>
      <DailyMenuManager key={date} date={date} today={today} items={items} copySource={copySource} />
    </>
  );
}
