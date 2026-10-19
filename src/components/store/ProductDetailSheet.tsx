"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import AddToCartControl, { useProductCart } from "@/components/store/AddToCartControl";
import ProductImage from "@/components/store/ProductImage";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/types";

interface ProductDetailSheetProps {
  // Producto abierto; null = cerrada.
  product: Product | null;
  onClose: () => void;
}

// Detalle de un producto: pegado abajo en celular (hoja) y centrado desde sm.
//
// Construido para no depender de nada frágil en Safari de iPhone (ver
// BITACORA.md, 2026-10-18 "Hoja de detalle en celular"):
// - Solo se monta abierta. La posición la da el layout (un contenedor fijo
//   con flex que alinea la hoja abajo o al centro), no un translate que
//   cambia de estado: si la animación de entrada no corre, la hoja igual
//   queda en su sitio y visible.
// - Fondo y hoja viven en el mismo contenedor fijo (z-[60]); la hoja va
//   después y con z propio, así nunca queda debajo del fondo.
// - Sin backdrop-filter, sin arrastre ni transform en línea.
// - Altura máxima en vh con dvh solo donde se soporta, y la zona con scroll
//   usa flex-auto + min-h-0 (no flex-1 con base 0%, que Safari puede
//   colapsar a altura 0 en columnas con altura automática).
export default function ProductDetailSheet({ product, onClose }: ProductDetailSheetProps) {
  if (!product) return null;
  return <OpenSheet product={product} onClose={onClose} />;
}

function OpenSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { isSoldOut, stockNote } = useProductCart(product);

  // Abierta: Escape cierra, la página de fondo no hace scroll y el foco va al
  // botón de cerrar; al cerrar vuelve a donde estaba (la tarjeta).
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/50" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="animate-sheet-in relative z-10 flex w-full [max-height:90vh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl supports-[height:100dvh]:max-h-[90dvh] sm:max-w-lg sm:rounded-[28px] dark:bg-zinc-900"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm transition-colors duration-200 hover:bg-white"
        >
          <X size={20} />
        </button>

        <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain">
          <div className="stage aspect-square w-full bg-stage sm:aspect-[4/3]">
            <ProductImage
              src={product.image_url}
              name={product.name}
              size="detail"
              className={isSoldOut ? "opacity-50 grayscale" : ""}
            />
          </div>

          <div className="px-5 pt-5 pb-4">
            <h2
              id="product-detail-title"
              className="text-2xl leading-tight font-semibold tracking-tight text-balance text-zinc-900 dark:text-white"
            >
              {product.name}
            </h2>
            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
              {formatCOP(product.price)}
            </p>
            {(isSoldOut || stockNote) && (
              <p className="mt-1 text-[13px] font-medium text-amber-700 dark:text-amber-400">
                {isSoldOut ? "Agotado por ahora" : stockNote}
              </p>
            )}
            {product.description?.trim() && (
              <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                {product.description.trim()}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-100 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
          <AddToCartControl product={product} size="sheet" />
        </div>
      </div>
    </div>
  );
}
