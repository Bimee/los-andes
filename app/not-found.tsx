import { BackLink } from '@/components/menu/BackLink';

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>No encontramos esa página</h1>
      <p>Puede que esa categoría ya no esté en la carta.</p>
      <BackLink />
    </main>
  );
}
