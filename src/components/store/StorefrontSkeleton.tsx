// Esqueleto de la vitrina mientras carga: imita el encabezado, el buscador,
// las categorías y la grilla. Neutro (todavía no se conoce el color de marca).

const block = "rounded-full bg-zinc-200 dark:bg-slate-800";

export default function StorefrontSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando tienda"
      className="flex-1 bg-zinc-50 dark:bg-slate-950 dark:[color-scheme:dark]"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <header className="bg-zinc-200/70 dark:bg-slate-900">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 sm:px-6 sm:py-8">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-zinc-300/80 sm:h-16 sm:w-16 dark:bg-slate-800" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="h-6 w-2/3 max-w-56 rounded-full bg-zinc-300/80 dark:bg-slate-800" />
              <div className="h-3.5 w-4/5 max-w-64 rounded-full bg-zinc-300/60 dark:bg-slate-800/70" />
            </div>
            <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-300/60 dark:bg-slate-800/70" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pt-3 pb-2.5 sm:px-6">
          <div className="h-11 rounded-2xl border border-zinc-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="mt-2.5 flex gap-2 overflow-hidden">
            {[64, 88, 76, 96, 72].map((width, i) => (
              <div key={i} className={`h-10 shrink-0 ${block}`} style={{ width }} />
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pt-4 sm:gap-5 sm:px-6 sm:pt-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              // En celular solo se ven 4 (2 filas); el resto aparece en pantallas más altas.
              className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 ${
                i >= 4 ? "hidden md:block" : ""
              }`}
            >
              <div className="aspect-square bg-zinc-100 dark:bg-slate-800" />
              <div className="flex flex-col gap-2 p-3 sm:p-4">
                <div className={`h-3.5 w-11/12 ${block}`} />
                <div className={`h-3.5 w-3/5 ${block}`} />
                <div className={`mt-3 h-5 w-2/5 ${block}`} />
                <div className="mt-1 h-11 rounded-xl bg-zinc-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando tienda...</span>
    </div>
  );
}
