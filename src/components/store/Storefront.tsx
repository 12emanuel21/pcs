"use client";

import { useMemo, useState } from "react";
import { PackageSearch, Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { categoryKey, uniqueCategories } from "@/lib/categories";
import type { Product } from "@/types";

const ALL = "Todos";

interface StorefrontProps {
  initialProducts: Product[];
}

// Normaliza para buscar sin importar tildes ni mayúsculas ("cafe" = "Café").
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase();
}

export default function Storefront({ initialProducts }: StorefrontProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL);

  const categories = useMemo(
    () => uniqueCategories(initialProducts),
    [initialProducts],
  );

  const filteredProducts = useMemo(() => {
    const terms = normalize(searchTerm).split(/\s+/).filter(Boolean);
    const selectedKey = selectedCategory === ALL ? null : categoryKey(selectedCategory);

    const matches = initialProducts.filter((product) => {
      if (selectedKey && categoryKey(product.category ?? "") !== selectedKey) {
        return false;
      }
      if (terms.length === 0) return true;
      const haystack = normalize(
        `${product.name} ${product.description ?? ""} ${product.category ?? ""}`,
      );
      return terms.every((term) => haystack.includes(term));
    });

    // Agotados al final, sin alterar el orden del resto (sort es estable).
    return matches.sort(
      (a, b) => Number(a.stock === 0) - Number(b.stock === 0),
    );
  }, [initialProducts, searchTerm, selectedCategory]);

  const hasFilters = searchTerm.trim() !== "" || selectedCategory !== ALL;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(ALL);
  };

  if (initialProducts.length === 0) {
    return <EmptyState title="Esta tienda aún no tiene productos disponibles." />;
  }

  return (
    <>
      {/* Buscador y categorías fijos arriba al hacer scroll. */}
      <div className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto max-w-6xl px-4 pt-3 pb-2.5 sm:px-6">
          <label className="relative block">
            <span className="sr-only">Buscar productos</span>
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500"
            />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos"
              // text-base (16px): evita el zoom automático de iOS al enfocar.
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-11 text-base text-zinc-900 shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-brand/60 focus:ring-4 focus:ring-brand/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Borrar búsqueda"
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-400 transition-colors duration-200 hover:text-zinc-700 dark:text-slate-500 dark:hover:text-slate-200"
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
                    className={`mr-2 inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-all duration-200 last:mr-0 active:scale-95 ${
                      isActive
                        ? "border-transparent bg-brand text-brand-fg shadow-md shadow-brand/25"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
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

      {/* Espacio inferior para que el botón flotante del carrito (56px +
          margen + área segura del iPhone) no tape la última fila. */}
      <main className="mx-auto max-w-6xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6">
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No se encontraron productos"
            description={
              searchTerm.trim()
                ? `No hay resultados para "${searchTerm.trim()}"${
                    selectedCategory !== ALL ? ` en ${selectedCategory}` : ""
                  }.`
                : `No hay productos en ${selectedCategory}.`
            }
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
                className="mb-3 text-sm text-zinc-500 dark:text-slate-400"
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
                cada tarjeta descuenta los espacios entre columnas (gap-3 y
                gap-5). */}
            <div className="flex flex-wrap gap-3 sm:gap-5 md:justify-center">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
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
      <p className="font-semibold text-zinc-800 dark:text-slate-100">{title}</p>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-slate-400">{description}</p>
      )}
      {action}
    </div>
  );
}
