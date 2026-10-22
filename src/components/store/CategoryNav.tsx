"use client";

import { LayoutGrid } from "lucide-react";
import { ALL_CATEGORIES } from "@/components/store/useCatalogFilters";

interface CategoryNavProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  className?: string;
}

// Barra horizontal de categorías: un círculo con la inicial (o un ícono en
// "Todos") y el nombre debajo. La activa rellena el círculo con el color de
// la tienda y pone el nombre en negrita. En celular se desliza de lado.
export default function CategoryNav({
  categories,
  selected,
  onSelect,
  className = "",
}: CategoryNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Categorías"
      className={`hide-scrollbar flex gap-1 overflow-x-auto scroll-smooth ${className}`}
    >
      {[ALL_CATEGORIES, ...categories].map((category) => {
        const isActive = category === selected;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 outline-none"
          >
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-brand group-focus-visible:ring-offset-2 group-active:scale-95 motion-reduce:transition-none ${
                isActive
                  ? "bg-brand text-brand-fg shadow-md shadow-brand/30"
                  : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-700"
              }`}
            >
              {category === ALL_CATEGORIES ? (
                <LayoutGrid size={20} />
              ) : (
                category.trim().charAt(0).toLocaleUpperCase("es")
              )}
            </span>
            <span
              className={`max-w-full truncate px-0.5 text-xs ${
                isActive
                  ? "font-bold text-zinc-900 dark:text-white"
                  : "font-medium text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {category}
            </span>
          </button>
        );
      })}
    </div>
  );
}
