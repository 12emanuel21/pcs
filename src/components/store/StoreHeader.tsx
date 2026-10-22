import StoreLogo from "@/components/store/StoreLogo";
import ThemeToggle from "@/components/ThemeToggle";
import type { Store } from "@/types";

// Encabezado compacto de la plantilla minimalista, en el color de la tienda:
// logo, nombre completo (hasta 2 líneas, con tamaño que se adapta al ancho)
// y tema.
export default function StoreHeader({ store }: { store: Pick<Store, "name" | "logo_url"> }) {
  return (
    <header className="bg-brand text-brand-fg">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-5">
        {store.logo_url && (
          <StoreLogo
            name={store.name}
            logoUrl={store.logo_url}
            // Sobre el encabezado (ya del color de marca), la inicial va en
            // un recuadro translúcido.
            fallbackClassName="bg-white/20 text-brand-fg"
            className="h-11 w-11 shrink-0 rounded-xl text-xl ring-1 ring-white/30 sm:h-14 sm:w-14 sm:rounded-2xl"
          />
        )}
        <h1 className="line-clamp-2 min-w-0 flex-1 text-[clamp(1.125rem,5.2vw,1.875rem)] leading-tight font-semibold tracking-tight text-balance">
          {store.name}
        </h1>
        <ThemeToggle className="-mr-2 bg-black/10 hover:bg-black/20" />
      </div>
    </header>
  );
}
