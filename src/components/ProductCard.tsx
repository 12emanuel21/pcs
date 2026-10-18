"use client";

import { ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

// Los colores de marca (bg-brand, text-brand-fg) vienen de las variables CSS
// del contenedor .brand-scope de la vitrina, ya ajustadas a claro/oscuro.
export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.id === product.id)?.quantity ?? 0,
  );

  // stock null/undefined = ilimitado.
  const hasStockLimit = product.stock !== null && product.stock !== undefined;
  const isSoldOut = hasStockLimit && product.stock === 0;

  const handleAdd = () => {
    if (hasStockLimit && inCart >= (product.stock ?? 0)) {
      toast.error(
        `Solo hay ${product.stock} ${product.stock === 1 ? "unidad disponible" : "unidades disponibles"} de ${product.name}.`,
      );
      return;
    }
    // Sin toast: el contador del carrito hace "pop" y la tarjeta muestra la
    // cantidad agregada.
    addItem(product);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-md shadow-zinc-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 dark:hover:shadow-black/50">
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-slate-800">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isSoldOut ? "opacity-60 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-slate-600">
            <ImageOff size={36} />
          </div>
        )}
        {isSoldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-zinc-800/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm dark:bg-slate-700/90">
            Agotado
          </span>
        )}
        {inCart > 0 && !isSoldOut && (
          <span className="absolute right-2.5 top-2.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-xs font-bold text-brand-fg shadow-md">
            {inCart}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category && (
          <p className="mb-1 truncate text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-slate-500">
            {product.category}
          </p>
        )}
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 sm:text-base dark:text-slate-100">
          {product.name}
        </h2>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 sm:text-sm dark:text-slate-400">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <p className="text-base font-bold tabular-nums tracking-tight text-zinc-900 sm:text-lg dark:text-white">
            {formatCOP(product.price)}
          </p>
          {/* min-h-11: área táctil de 44px (estándar de accesibilidad móvil). */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSoldOut}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-semibold text-brand-fg shadow-sm transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none disabled:hover:brightness-100 disabled:active:scale-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            {isSoldOut ? (
              "Agotado"
            ) : (
              <>
                <Plus size={18} strokeWidth={2.5} />
                <span className="sm:hidden">Agregar</span>
                <span className="hidden sm:inline">Agregar al Carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
