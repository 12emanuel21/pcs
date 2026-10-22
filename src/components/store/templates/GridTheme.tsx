"use client";

import { useCallback, useState } from "react";
import { PackageSearch, Search, X } from "lucide-react";
import Cart from "@/components/Cart";
import ProductDetailSheet from "@/components/store/ProductDetailSheet";
import StoreFooter from "@/components/store/StoreFooter";
import StoreLogo from "@/components/store/StoreLogo";
import GridProductCard from "@/components/store/templates/GridProductCard";
import { ALL_CATEGORIES, useCatalogFilters } from "@/components/store/useCatalogFilters";
import ThemeToggle from "@/components/ThemeToggle";
import type { Product, Store } from "@/types";

interface GridThemeProps {
  store: Store;
  initialProducts: Product[];
}

// Plantilla "grid" (Catálogo denso): pensada para inventarios grandes de
// repuestos o accesorios, con la mayor cantidad de productos en pantalla.
// Encabezado de una línea, filtros pegajosos compactos y una grilla de 2 a 6
// columnas. Sigue el tema claro/oscuro de la tienda y del comprador. No usa
// la portada.
export default function GridTheme({ store, initialProducts }: GridThemeProps) {
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
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 dark:[color-scheme:dark]">
      {/* Encabezado mínimo. La franja superior lleva el color de la tienda. */}
      <header className="border-t-[3px] border-brand bg-white dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2.5 px-2 py-1 sm:px-3">
          {store.logo_url && (
            <StoreLogo
              name={store.name}
              logoUrl={store.logo_url}
              className="h-8 w-8 shrink-0 rounded-md text-base ring-1 ring-black/5 dark:ring-white/10"
            />
          )}
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-100">
            {store.name}
          </h1>
          <ThemeToggle className="-mr-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" />
        </div>
      </header>

      {initialProducts.length === 0 ? (
        <GridEmptyState title="Esta tienda aún no tiene productos disponibles." />
      ) : (
        <>
          {/* Buscador y categorías pegajosos, con el menor alto posible. */}
          <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="mx-auto w-full max-w-[1600px] px-2 py-1.5 sm:px-3">
              <label className="relative block">
                <span className="sr-only">Buscar productos</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos"
                  // text-base (16px): evita el zoom automático de iOS al enfocar.
                  className="h-9 w-full rounded-md bg-zinc-100 pr-9 pl-9 text-base text-zinc-900 outline-none transition-colors duration-200 placeholder:text-zinc-500 focus:bg-white focus:ring-2 focus:ring-brand/40 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Borrar búsqueda"
                    className="absolute top-0 right-0 flex h-9 w-9 items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>

              {categories.length > 0 && (
                <div
                  role="tablist"
                  aria-label="Categorías"
                  className="hide-scrollbar -mx-2 mt-1.5 overflow-x-auto px-2 whitespace-nowrap sm:-mx-3 sm:px-3"
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
                        className={`mr-1.5 inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium transition-colors duration-200 last:mr-0 ${
                          isActive
                            ? "bg-brand text-brand-fg"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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

          <main className="mx-auto w-full max-w-[1600px] flex-1 px-2 pt-2 pb-8 sm:px-3 sm:pt-3">
            {filteredProducts.length === 0 ? (
              <GridEmptyState
                title="No se encontraron productos"
                description={noResultsDescription}
                action={
                  hasFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-sm font-semibold text-brand-fg transition-all duration-200 hover:brightness-110"
                    >
                      Ver todos los productos
                    </button>
                  ) : null
                }
              />
            ) : (
              <>
                {hasFilters && (
                  <p className="mb-2 text-[13px] text-zinc-500 dark:text-zinc-400" aria-live="polite">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "producto" : "productos"}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredProducts.map((product) => (
                    <GridProductCard
                      key={product.id}
                      product={product}
                      onOpenDetail={setDetailProduct}
                    />
                  ))}
                </div>
              </>
            )}
          </main>

          <ProductDetailSheet product={detailProduct} onClose={closeDetail} />
        </>
      )}

      <StoreFooter store={store} />
      <Cart store={store} />
    </div>
  );
}

function GridEmptyState({
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
      <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <PackageSearch size={26} />
      </span>
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{title}</p>
      {description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action}
    </div>
  );
}
