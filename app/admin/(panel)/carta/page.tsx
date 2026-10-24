import { CartaManager } from '@/components/admin/CartaManager';
import { getCarta } from '@/lib/admin-data';
import { requireStaff } from '@/lib/auth';

export default async function CartaPage() {
  const db = await requireStaff();
  const categories = await getCarta(db);

  return (
    <>
      <h1 className="admin-title">Carta</h1>
      <p className="admin-lead">
        Tocá una categoría para ver sus platos. Desde ahí agregás, editás, marcás agotado o borrás.
      </p>
      <CartaManager categories={categories} />
    </>
  );
}
