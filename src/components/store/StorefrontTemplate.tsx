import Cart from "@/components/Cart";
import StoreFooter from "@/components/store/StoreFooter";
import StoreHeader from "@/components/store/StoreHeader";
import Storefront from "@/components/store/Storefront";
import GamerTheme from "@/components/store/templates/GamerTheme";
import GridTheme from "@/components/store/templates/GridTheme";
import type { StoreHero, StoreTemplate } from "@/lib/templates";
import type { Product, Store } from "@/types";

interface StorefrontTemplateProps {
  template: StoreTemplate;
  store: Store;
  hero: StoreHero | null;
  initialProducts: Product[];
}

// Enrutador de plantillas de la vitrina: cada plantilla arma la página
// completa (cabecera, catálogo, pie y carrito), porque cambian también la
// cabecera y el tema (la gamer es siempre oscura; la de catálogo denso tiene
// su propio encabezado compacto y no usa la portada).
export default function StorefrontTemplate({
  template,
  store,
  hero,
  initialProducts,
}: StorefrontTemplateProps) {
  switch (template) {
    case "gamer":
      return <GamerTheme store={store} hero={hero} initialProducts={initialProducts} />;
    case "grid":
      return <GridTheme store={store} initialProducts={initialProducts} />;
    case "minimal":
      return (
        <div className="flex min-h-screen w-full flex-col bg-white text-zinc-900 dark:bg-black dark:text-zinc-100 dark:[color-scheme:dark]">
          <StoreHeader store={store} />
          {/* Buscador, categorías y grilla filtrable (Client Component). */}
          <Storefront hero={hero} initialProducts={initialProducts} />
          <StoreFooter store={store} />
          <Cart store={store} />
        </div>
      );
  }
}
