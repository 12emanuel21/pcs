"use client";

import { useCallback, useState } from "react";
import { PackageSearch, Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDetailSheet from "@/components/store/ProductDetailSheet";
import {
  ALL_CATEGORIES as ALL,
  CARD_WIDTH_CLASS,
  useCatalogFilters,
} from "@/components/store/useCatalogFilters";
import type { StoreHero } from "@/lib/templates";
import type { Product } from "@/types";

interface StorefrontProps {
  // Portada de la tienda (null = sin portada). La plantilla minimalista
  // todavía no la muestra.
  hero: StoreHero | null;
  initialProducts: Product[];
}

// Catálogo de la plantilla minimalista: buscador, categorías y grilla.
export default function Storefront({ initialProducts }: StorefrontProps) {
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
  // Producto abierto en la hoja de detalle (null = cerrada).
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const closeDetail = useCallback(() => setDetailProduct(null), []);

  if (initialProducts.length === 0) {
    return <EmptyState title="Esta tienda aún no tiene productos disponibles." />;
  }

  return (
    <>
      {/* Buscador y categorías fijos arriba al hacer scroll. */}
      <div className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/85 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-black/80">
        <div className="mx-auto max-w-6xl px-4 pt-3 pb-2.5 sm:px-6">
          <label className="relative block">
            <span className="sr-only">Buscar productos</span>
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos"
              // text-base (16px): evita el zoom automático de iOS al enfocar.
              className="h-11 w-full rounded-full bg-zinc-100 pl-11 pr-11 text-base text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-500 focus:bg-white focus:ring-2 focus:ring-brand/40 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Borrar búsqueda"
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition-colors duration-200 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            )}
          </label>

          {categories.length > 0 && (
            <div
              role="tablist"
              aria-label="Categorías"
              className="hide-scrollbar -mx-4 mt-2.5 overflow-x-auto whitespace-nowrap px-4 sm:-mx-6 sm:px-6"
            >
              {[ALL, ...categories].map((category) => {
                const isActive = category === selectedCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(category)}
                    className={`mr-2 inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-all duration-200 last:mr-0 active:scale-95 ${
                      isActive
                        ? "bg-brand text-brand-fg"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
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

      {/* El espacio para el botón flotante del carrito lo deja el pie de
          página (StoreFooter). */}
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-12 sm:px-6 sm:pt-8">
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No se encontraron productos"
            description={noResultsDescription}
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                >
                  Ver todos los productos
                </button>
              ) : null
            }
          />
        ) : (
          <>
            {hasFilters && (
              <p
                className="mb-4 text-sm text-zinc-500 dark:text-zinc-400"
                aria-live="polite"
              >
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "producto" : "productos"}
              </p>
            )}
            {/* 2 columnas en móvil, como las apps de catálogo; 3 y 4 en
                pantallas anchas. Flex en vez de grid para centrar una última
                fila incompleta desde 3 columnas: en grid quedaba pegada a la
                izquierda y la vitrina se veía cargada a ese lado. El ancho de
                cada tarjeta descuenta los espacios entre columnas (gap-x-3 y
                gap-x-5); el espacio vertical (gap-y) es mayor para que las
                filas respiren sin marcos alrededor de cada tarjeta. */}
            <div className="flex flex-wrap gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:justify-center">
              {filteredProducts.map((product) => (
                <div key={product.id} className={CARD_WIDTH_CLASS}>
                  <ProductCard product={product} onOpenDetail={setDetailProduct} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <ProductDetailSheet product={detailProduct} onClose={closeDetail} />
    </>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <PackageSearch size={30} />
      </span>
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{title}</p>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {action}
    </div>
  );
}
