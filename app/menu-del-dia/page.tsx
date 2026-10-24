import type { Metadata } from 'next';
import { connection } from 'next/server';
import { BackLink } from '@/components/menu/BackLink';
import { CategoryChips } from '@/components/menu/CategoryChips';
import { DishList } from '@/components/menu/DishList';
import { MenuFrame } from '@/components/menu/MenuFrame';
import { dailyEmptyText, visibleDaily } from '@/components/menu/TodayCard';
import { demoParam, getPublicMenu, menuStatus } from '@/lib/data';
import { formatLongDate } from '@/lib/hours';

export const metadata: Metadata = { title: 'Menú del día | Rotisería Los Andes' };

type Props = { searchParams: Promise<{ demo?: string | string[] }> };

export default async function DailyMenuPage({ searchParams }: Props) {
  await connection();
  const { demo } = await searchParams;
  const menu = await getPublicMenu(demoParam(demo));
  const status = menuStatus(menu);
  const dishes = visibleDaily(menu.daily, status);
  const hasContact = Boolean(menu.settings.whatsapp);

  return (
    <MenuFrame menu={menu} status={status}>
      <BackLink />
      <h1 className="page-title">Menú del día</h1>
      <p className="page-sub">{formatLongDate(menu.today)}</p>

      <CategoryChips
        categories={menu.categories.map(({ slug, name }) => ({ slug, name }))}
        current="menu-del-dia"
      />

      {dishes.length > 0 ? (
        <DishList dishes={dishes} />
      ) : (
        <div className="dish-empty">
          {dailyEmptyText(status, menu.hours, menu.today, hasContact).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {status.manual && status.note ? <p>{status.note}</p> : null}
        </div>
      )}

      <div className="page-end">
        <BackLink />
      </div>
    </MenuFrame>
  );
}
