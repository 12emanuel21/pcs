// Esqueleto de la vitrina mientras carga: imita el encabezado compacto, el
// buscador y la grilla de tarjetas sin marco (foto sobre la vitrina, nombre,
// precio y botón). Neutro (todavía no se conoce el color de marca).

const block = "rounded-full bg-zinc-200 dark:bg-zinc-800";

export default function StorefrontSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando tienda"
      className="flex-1 bg-white dark:bg-black dark:[color-scheme:dark]"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <header className="bg-zinc-200/70 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-5">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-zinc-300/80 sm:h-14 sm:w-14 sm:rounded-2xl dark:bg-zinc-800" />
            <div className="h-6 w-2/3 max-w-64 rounded-full bg-zinc-300/80 dark:bg-zinc-800" />
            <div className="ml-auto h-11 w-11 shrink-0 rounded-full bg-zinc-300/60 dark:bg-zinc-800/70" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pt-3 pb-2.5 sm:px-6">
          <div className="h-11 rounded-full bg-zinc-100 dark:bg-zinc-900" />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-3 gap-y-8 px-4 pt-5 sm:gap-x-5 sm:gap-y-10 sm:px-6 sm:pt-8 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              // En celular solo se ven 4 (2 filas); el resto aparece en pantallas más altas.
              className={i >= 4 ? "hidden md:block" : ""}
            >
              <div className="aspect-square rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
              <div className="flex flex-col gap-2 px-1 pt-3">
                <div className={`h-4 w-11/12 ${block}`} />
                <div className={`h-4 w-2/5 ${block}`} />
                <div className="mt-3 h-11 rounded-full bg-zinc-100 dark:bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando tienda...</span>
    </div>
  );
}
