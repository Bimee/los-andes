import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { BackLink } from '@/components/menu/BackLink';
import { CategoryChips } from '@/components/menu/CategoryChips';
import { DishList } from '@/components/menu/DishList';
import { MenuFrame } from '@/components/menu/MenuFrame';
import { demoParam, getPublicMenu, menuStatus } from '@/lib/data';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ demo?: string | string[] }>;
};

async function load({ params, searchParams }: Props) {
  await connection();
  const [{ slug }, { demo }] = await Promise.all([params, searchParams]);
  const menu = await getPublicMenu(demoParam(demo));
  return { menu, category: menu.categories.find((c) => c.slug === slug) ?? null };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { menu, category } = await load(props);
  return {
    title: category ? `${category.name} | ${menu.settings.business_name}` : menu.settings.business_name,
  };
}

export default async function CategoryPage(props: Props) {
  const { menu, category } = await load(props);
  // Oculta, vacía o inexistente: no se muestra
  if (!category) notFound();

  const count = category.products.length;

  return (
    <MenuFrame menu={menu} status={menuStatus(menu)}>
      <BackLink />
      <h1 className="page-title">{category.name}</h1>
      <p className="page-sub">{count === 1 ? '1 plato' : `${count} platos`}</p>

      <CategoryChips
        categories={menu.categories.map(({ slug, name }) => ({ slug, name }))}
        current={category.slug}
      />

      <DishList dishes={category.products} />

      <div className="page-end">
        <BackLink />
      </div>
    </MenuFrame>
  );
}
