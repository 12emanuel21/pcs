"use client";

import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

// Desde cuántas unidades se avisa "Últimas N unidades".
const LOW_STOCK_THRESHOLD = 5;

// Estado de un producto respecto al carrito, compartido por la tarjeta y la
// hoja de detalle para que ambas muestren lo mismo.
export function useProductCart(product: Product) {
  const addItem = useCartStore((state) => state.addItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.id === product.id)?.quantity ?? 0,
  );

  // stock null/undefined = ilimitado.
  const hasStockLimit = product.stock !== null && product.stock !== undefined;
  const stock = product.stock ?? 0;
  const isSoldOut = hasStockLimit && stock === 0;
  const atLimit = hasStockLimit && inCart >= stock;

  // Aviso discreto sobre el precio: el tope alcanzado manda sobre "últimas".
  let stockNote: string | null = null;
  if (!isSoldOut && inCart > 0 && atLimit) {
    stockNote = "No hay más unidades";
  } else if (!isSoldOut && hasStockLimit && stock <= LOW_STOCK_THRESHOLD) {
    stockNote = stock === 1 ? "Última unidad" : `Últimas ${stock} unidades`;
  }

  const add = () => {
    if (atLimit) {
      toast.error(
        `Solo hay ${stock} ${stock === 1 ? "unidad disponible" : "unidades disponibles"} de ${product.name}.`,
      );
      return;
    }
    // Sin toast: el contador del carrito hace "pop" y el botón se convierte
    // en el selector de cantidad.
    addItem(product);
  };

  const decrease = () => decreaseItem(product.store_id, product.id);

  return { inCart, isSoldOut, atLimit, stockNote, add, decrease };
}

interface AddToCartControlProps {
  product: Product;
  // "card": tarjeta del catálogo (44px); "sheet": hoja de detalle (52px).
  size?: "card" | "sheet";
  className?: string;
}

// Botón "Agregar" que, con el producto ya en el carrito, se vuelve un
// selector "− cantidad +" en el mismo lugar y con la misma altura.
export default function AddToCartControl({
  product,
  size = "card",
  className = "",
}: AddToCartControlProps) {
  const { inCart, isSoldOut, atLimit, add, decrease } = useProductCart(product);
  const isSheet = size === "sheet";
  const height = isSheet ? "min-h-13" : "min-h-11";
  const stepperButton = `flex ${isSheet ? "h-13 w-14" : "h-11 w-11"} items-center justify-center rounded-full transition-all duration-200 hover:bg-brand/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:active:scale-100`;

  if (inCart > 0 && !isSoldOut) {
    return (
      <div
        className={`flex ${height} items-center justify-between rounded-full bg-brand/12 text-brand-ink ${className}`}
      >
        <button
          type="button"
          onClick={decrease}
          aria-label={
            inCart === 1
              ? `Quitar ${product.name} del carrito`
              : `Quitar una unidad de ${product.name}`
          }
          className={stepperButton}
        >
          <Minus size={isSheet ? 20 : 18} strokeWidth={2.5} />
        </button>
        <span
          className={`${isSheet ? "text-lg" : "text-base"} font-semibold tabular-nums`}
          aria-live="polite"
          aria-label={`${inCart} en el carrito`}
        >
          {inCart}
        </span>
        <button
          type="button"
          onClick={add}
          disabled={atLimit}
          aria-label={`Agregar una unidad de ${product.name}`}
          className={stepperButton}
        >
          <Plus size={isSheet ? 20 : 18} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={isSoldOut}
      className={`flex ${height} w-full items-center justify-center gap-1.5 rounded-full bg-brand px-4 ${isSheet ? "text-base" : "text-sm"} font-semibold text-brand-fg transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 disabled:hover:brightness-100 disabled:active:scale-100 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-400 ${className}`}
    >
      {isSoldOut ? (
        "Agotado"
      ) : (
        <>
          <Plus size={isSheet ? 20 : 18} strokeWidth={2.5} />
          {isSheet ? "Agregar al carrito" : "Agregar"}
        </>
      )}
    </button>
  );
}
