import type { Product } from "@/types";

// Clave de comparación: sin tildes, mayúsculas ni espacios extra, para que
// "Bebidas", "bebidas " y "Bébidas" cuenten como la misma categoría.
export function categoryKey(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .trim()
    .toLowerCase();
}

// Categorías únicas (se conserva la primera forma escrita), ordenadas
// alfabéticamente en español. Ignora nulos y vacíos.
export function uniqueCategories(products: Pick<Product, "category">[]): string[] {
  const byKey = new Map<string, string>();
  for (const { category } of products) {
    const value = category?.trim();
    if (!value) continue;
    const key = categoryKey(value);
    if (!byKey.has(key)) byKey.set(key, value);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "es"));
}
