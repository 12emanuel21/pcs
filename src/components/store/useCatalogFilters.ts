"use client";

import { useMemo, useState } from "react";
import { categoryKey, uniqueCategories } from "@/lib/categories";
import type { Product } from "@/types";

// Píldora que muestra todas las categorías.
export const ALL_CATEGORIES = "Todos";

// Ancho de cada tarjeta en la grilla flex (ver Storefront): 2 columnas en
// móvil, 3 desde md y 4 desde lg. Descuenta los espacios entre columnas
// (gap-x-3 en móvil, gap-x-5 desde sm); si cambian, hay que actualizarlo.
export const CARD_WIDTH_CLASS =
  "w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]";

// Normaliza para buscar sin importar tildes ni mayúsculas ("cafe" = "Café").
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Búsqueda y categorías del catálogo, compartidas por todas las plantillas.
export function useCatalogFilters(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const categories = useMemo(() => uniqueCategories(products), [products]);

  const filteredProducts = useMemo(() => {
    const terms = normalize(searchTerm).split(/\s+/).filter(Boolean);
    const selectedKey =
      selectedCategory === ALL_CATEGORIES ? null : categoryKey(selectedCategory);

    const matches = products.filter((product) => {
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
    return matches.sort((a, b) => Number(a.stock === 0) - Number(b.stock === 0));
  }, [products, searchTerm, selectedCategory]);

  const hasFilters = searchTerm.trim() !== "" || selectedCategory !== ALL_CATEGORIES;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(ALL_CATEGORIES);
  };

  // Texto para "sin resultados" según los filtros activos.
  const noResultsDescription = searchTerm.trim()
    ? `No hay resultados para "${searchTerm.trim()}"${
        selectedCategory !== ALL_CATEGORIES ? ` en ${selectedCategory}` : ""
      }.`
    : `No hay productos en ${selectedCategory}.`;

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    hasFilters,
    clearFilters,
    noResultsDescription,
  };
}
