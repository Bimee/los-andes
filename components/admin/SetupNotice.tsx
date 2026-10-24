/** Se muestra en /admin cuando todavía no se cargaron las variables de Supabase. */
export function SetupNotice() {
  return (
    <main className="login">
      <h1 className="login__title">Falta conectar Supabase</h1>
      <p className="login__lead">
        El panel necesita las variables <code>NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>. Copiá <code>.env.example</code> como{' '}
        <code>.env.local</code>, completalas y reiniciá el servidor. Los pasos están en el README.
      </p>
      <a className="btn" href="/">
        Ver el menú de ejemplo
      </a>
    </main>
  );
}
