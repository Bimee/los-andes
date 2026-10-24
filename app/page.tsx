import { connection } from 'next/server';
import { CategoryCard } from '@/components/menu/CategoryCard';
import { MenuFrame } from '@/components/menu/MenuFrame';
import { TodayCard } from '@/components/menu/TodayCard';
import { demoParam, getPublicMenu, menuStatus } from '@/lib/data';

type Props = { searchParams: Promise<{ demo?: string | string[] }> };

export default async function HomePage({ searchParams }: Props) {
  // Render en cada visita: el menú cambia todos los días y el estado depende de la hora.
  await connection();
  const { demo } = await searchParams;
  const menu = await getPublicMenu(demoParam(demo));
  const status = menuStatus(menu);
  const { settings, categories } = menu;

  return (
    <MenuFrame menu={menu} status={status} home>
      <TodayCard
        daily={menu.daily}
        today={menu.today}
        status={status}
        hours={menu.hours}
        hasContact={Boolean(settings.whatsapp)}
      />

      <section aria-labelledby="carta-title">
        <h2 className="section-title" id="carta-title">
          La carta
        </h2>
        {categories.length === 0 ? (
          <p className="carta-empty">Estamos actualizando la carta.</p>
        ) : (
          <ul className="cat-grid">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </ul>
        )}
      </section>
    </MenuFrame>
  );
}
