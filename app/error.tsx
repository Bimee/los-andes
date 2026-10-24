'use client';

export default function MenuError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="load-error">
      <h1>No pudimos cargar el menú</h1>
      <p>Puede ser la conexión. Probá de nuevo en un momento.</p>
      <button type="button" onClick={() => reset()}>
        Volver a intentar
      </button>
    </main>
  );
}
