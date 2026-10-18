"use client";

import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import ProductImage from "@/components/store/ProductImage";
import { formatCOP } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

// Desde cuántas unidades se avisa "Últimas N unidades".
const LOW_STOCK_THRESHOLD = 5;

// Los colores de marca (bg-brand, text-brand-fg) vienen de las variables CSS
// del contenedor .brand-scope de la vitrina, ya ajustadas a claro/oscuro.
export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.id === product.id)?.quantity ?? 0,
  );

  // stock null/undefined = ilimitado.
  const hasStockLimit = product.stock !== null && product.stock !== undefined;
  const isSoldOut = hasStockLimit && product.stock === 0;
  const stock = product.stock ?? 0;
  const atLimit = hasStockLimit && inCart >= stock;

  // Aviso discreto sobre el precio: el tope alcanzado manda sobre "últimas".
  let stockNote: string | null = null;
  if (!isSoldOut && inCart > 0 && atLimit) {
    stockNote = "No hay más unidades";
  } else if (!isSoldOut && hasStockLimit && stock <= LOW_STOCK_THRESHOLD) {
    stockNote = stock === 1 ? "Última unidad" : `Últimas ${stock} unidades`;
  }

  const handleAdd = () => {
    if (atLimit) {
      toast.error(
        `Solo hay ${product.stock} ${product.stock === 1 ? "unidad disponible" : "unidades disponibles"} de ${product.name}.`,
      );
      return;
    }
    // Sin toast: el contador del carrito hace "pop" y el botón se convierte
    // en el selector de cantidad.
    addItem(product);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-md shadow-zinc-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 dark:hover:shadow-black/50">
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-slate-800">
        <ProductImage
          src={product.image_url}
          name={product.name}
          className={`transition-transform duration-300 group-hover:scale-105 ${
            isSoldOut ? "opacity-60 grayscale" : ""
          }`}
        />
        {isSoldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-zinc-800/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm dark:bg-slate-700/90">
            Agotado
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
          {stockNote && (
            <p className="mb-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              {stockNote}
            </p>
          )}
          <p className="text-base font-bold tabular-nums tracking-tight text-zinc-900 sm:text-lg dark:text-white">
            {formatCOP(product.price)}
          </p>
          {/* min-h-11: área táctil de 44px (estándar de accesibilidad móvil).
              Ya en el carrito, el botón se vuelve "− cantidad +" en el mismo
              lugar y con la misma altura (sin saltos en la grilla). */}
          {inCart > 0 && !isSoldOut ? (
            <div className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-brand/12 text-brand-ink">
              <button
                type="button"
                onClick={() => decreaseItem(product.store_id, product.id)}
                aria-label={
                  inCart === 1
                    ? `Quitar ${product.name} del carrito`
                    : `Quitar una unidad de ${product.name}`
                }
                className={stepperButtonClass}
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>
              <span
                className="text-base font-semibold tabular-nums"
                aria-live="polite"
                aria-label={`${inCart} en el carrito`}
              >
                {inCart}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={atLimit}
                aria-label={`Agregar una unidad de ${product.name}`}
                className={stepperButtonClass}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </article>
  );
}

// Botones de 44x44px dentro del selector de cantidad de la tarjeta.
const stepperButtonClass =
  "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:bg-brand/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:active:scale-100";
