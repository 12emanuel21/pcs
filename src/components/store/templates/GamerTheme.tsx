"use client";

import { useCallback, useState } from "react";
import { PackageSearch, Search, X } from "lucide-react";
import Cart from "@/components/Cart";
import ProductDetailSheet from "@/components/store/ProductDetailSheet";
import StoreFooter from "@/components/store/StoreFooter";
import StoreLogo from "@/components/store/StoreLogo";
import GamerProductCard from "@/components/store/templates/GamerProductCard";
import {
  ALL_CATEGORIES,
  CARD_WIDTH_CLASS,
  useCatalogFilters,
} from "@/components/store/useCatalogFilters";
import type { StoreHero } from "@/lib/templates";
import type { Product, Store } from "@/types";

interface GamerThemeProps {
  store: Store;
  hero: StoreHero | null;
  initialProducts: Product[];
}

// Plantilla "gamer": tienda de hardware de alto rendimiento. Siempre oscura,
// por tres vías que no dependen entre sí: la página fuerza el tema oscuro en
// next-themes (forcedTheme), la clase .dark del contenedor activa las
// variantes dark: y la paleta de marca oscura, y el contenedor y los textos
// llevan colores explícitos (no heredan del body). Con una portada
// inmersiva y tarjetas que se iluminan con el color de la tienda. Incluye su
// pie y el carrito para que también queden en oscuro.
export default function GamerTheme({ store, hero, initialProducts }: GamerThemeProps) {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    hasFilters,
    clearFilters,
    noResultsDescription,
  } = useCatalogFilters(initialProducts);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const closeDetail = useCallback(() => setDetailProduct(null), []);

  return (
    <div className="dark flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 [color-scheme:dark]">
      <GamerHero store={store} hero={hero} />

      {initialProducts.length === 0 ? (
        <GamerEmptyState title="Esta tienda aún no tiene productos disponibles." />
      ) : (
        <>
          {/* Buscador y categorías fijos arriba al hacer scroll. */}
          <div className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 pt-3 pb-2.5 sm:px-6">
              <label className="relative block">
                <span className="sr-only">Buscar productos</span>
                <Search
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos"
                  // text-base (16px): evita el zoom automático de iOS al enfocar.
                  className="h-11 w-full rounded-md border border-zinc-800 bg-zinc-900 pr-11 pl-11 text-base text-zinc-100 outline-none transition-colors duration-200 placeholder:text-zinc-500 focus:border-brand [&::-webkit-search-cancel-button]:hidden"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Borrar búsqueda"
                    className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-zinc-500 transition-colors duration-200 hover:text-zinc-200"
                  >
                    <X size={18} />
                  </button>
                )}
              </label>

              {categories.length > 0 && (
                <div
                  role="tablist"
                  aria-label="Categorías"
                  className="hide-scrollbar -mx-4 mt-2.5 overflow-x-auto px-4 whitespace-nowrap sm:-mx-6 sm:px-6"
                >
                  {[ALL_CATEGORIES, ...categories].map((category) => {
                    const isActive = category === selectedCategory;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setSelectedCategory(category)}
                        className={`mr-2 inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors duration-200 last:mr-0 ${
                          isActive
                            ? "border-brand bg-brand text-brand-fg"
                            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-12 sm:px-6 sm:pt-8">
            {filteredProducts.length === 0 ? (
              <GamerEmptyState
                title="No se encontraron productos"
                description={noResultsDescription}
                action={
                  hasFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 inline-flex min-h-11 items-center rounded-md border border-brand px-5 text-sm font-semibold text-brand transition-colors duration-200 hover:bg-brand hover:text-brand-fg"
                    >
                      Ver todos los productos
                    </button>
                  ) : null
                }
              />
            ) : (
              <>
                {hasFilters && (
                  <p className="mb-4 text-sm text-zinc-400" aria-live="polite">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "producto" : "productos"}
                  </p>
                )}
                {/* Misma grilla que la minimalista: 2 columnas en móvil, 3 y 4
                    en pantallas anchas, última fila centrada desde 3. */}
                <div className="flex flex-wrap gap-3 sm:gap-5 md:justify-center">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className={CARD_WIDTH_CLASS}>
                      <GamerProductCard product={product} onOpenDetail={setDetailProduct} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>

          <ProductDetailSheet product={detailProduct} onClose={closeDetail} tone="outline" />
        </>
      )}

      <StoreFooter store={store} />
      <Cart store={store} />
    </div>
  );
}

// Portada inmersiva: imagen de portada (o un degradado del color de marca)
// con un velo oscuro, y al centro el logo, el título y el subtítulo. Sin
// portada configurada, el título es el nombre de la tienda.
function GamerHero({ store, hero }: { store: Store; hero: StoreHero | null }) {
  const title = hero?.title ?? store.name;

  return (
    <header className="relative isolate flex min-h-[300px] items-center justify-center overflow-hidden px-4 py-14 text-center sm:min-h-[40vh] sm:px-6">
      {/* Fondo: degradado del color de marca, con la imagen encima si existe
          (si la imagen no carga, queda el degradado). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-zinc-950 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-brand)_35%,transparent),transparent_70%)]"
      />
      {hero?.imageUrl && (
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(hero.imageUrl)})` }}
        />
      )}
      {/* Velo: con imagen, la oscurece para que el texto resalte; sin
          imagen, solo funde el degradado con el fondo de la página (un velo
          completo lo apagaría). */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 ${
          hero?.imageUrl ? "via-black/60 to-black/40" : "to-transparent"
        }`}
      />

      <div className="flex max-w-3xl flex-col items-center">
        {store.logo_url && (
          <StoreLogo
            name={store.name}
            logoUrl={store.logo_url}
            className="mb-5 h-16 w-16 rounded-xl text-2xl ring-1 ring-white/15 sm:h-20 sm:w-20"
          />
        )}
        {hero?.title && (
          <p className="mb-2 text-sm font-semibold text-zinc-300">{store.name}</p>
        )}
        <h1 className="text-4xl leading-[0.95] font-black tracking-tight text-balance text-brand uppercase md:text-6xl">
          {title}
        </h1>
        {hero?.subtitle && (
          <p className="mt-4 max-w-xl text-base text-balance text-zinc-300 md:text-lg">
            {hero.subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

function GamerEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-brand">
        <PackageSearch size={30} />
      </span>
      <p className="font-semibold text-zinc-100">{title}</p>
      {description && <p className="text-sm text-zinc-400">{description}</p>}
      {action}
    </div>
  );
}
