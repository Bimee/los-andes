import { PricesEditor } from '@/components/admin/PricesEditor';
import { getCarta } from '@/lib/admin-data';
import { requireStaff } from '@/lib/auth';

export default async function PricesPage() {
  const db = await requireStaff();
  const categories = await getCarta(db);

  return (
    <>
      <h1 className="admin-title">Precios</h1>
      <p className="admin-lead">
        Cada plato tiene su precio y, si querés, un precio en efectivo o transferencia. Cambialos y guardalos todos
        juntos al final.
      </p>
      <PricesEditor categories={categories} />
    </>
  );
}
