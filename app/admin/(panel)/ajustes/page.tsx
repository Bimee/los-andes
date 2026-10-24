import { HoursForm } from '@/components/admin/HoursForm';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getHours, getSettings } from '@/lib/admin-data';
import { requireStaff } from '@/lib/auth';

export default async function SettingsPage() {
  const db = await requireStaff();
  const [settings, hours] = await Promise.all([getSettings(db), getHours(db)]);

  return (
    <>
      <h1 className="admin-title">Horarios y datos</h1>
      <p className="admin-lead">Lo que se muestra arriba y abajo del menú.</p>

      <section className="admin-section" aria-labelledby="horarios-title">
        <h2 className="admin-section__title" id="horarios-title">
          Horarios de atención
        </h2>
        <HoursForm hours={hours} />
      </section>

      <section className="admin-section" aria-labelledby="datos-title">
        <h2 className="admin-section__title" id="datos-title">
          Datos del local
        </h2>
        <SettingsForm settings={settings} />
      </section>
    </>
  );
}
