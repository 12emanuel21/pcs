// Placeholder mientras carga una página del panel. Se usa en el <Suspense>
// de cada página: el del layout no cubre las navegaciones entre pestañas.
export default function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-8 h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
