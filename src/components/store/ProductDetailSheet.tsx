"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
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

// Arrastre hacia abajo (en px) desde el que la hoja se cierra al soltar.
const CLOSE_DRAG_DISTANCE = 96;

// Detalle de un producto: hoja inferior en celular y ventana centrada desde
// sm. Siempre montada (como el carrito) para animar la entrada y la salida;
// mientras se cierra sigue mostrando el último producto.
export default function ProductDetailSheet({ product, onClose }: ProductDetailSheetProps) {
  const isOpen = product !== null;
  const [displayed, setDisplayed] = useState(product);
  if (product && product !== displayed) setDisplayed(product);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  // Abierta: Escape cierra, la página de fondo no hace scroll y el foco va al
  // botón de cerrar; al cerrar vuelve a donde estaba (la tarjeta).
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  // Arrastrar el tirador hacia abajo cierra la hoja (gesto de iOS).
  const onDragStart = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onDragEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (dragY > CLOSE_DRAG_DISTANCE) onClose();
    setDragY(0);
  };

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        inert={!isOpen}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl transition-[translate,scale,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(88dvh,760px)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] dark:bg-zinc-900 ${
          isOpen
            ? "translate-y-0 sm:scale-100 sm:opacity-100"
            : "translate-y-full shadow-none sm:scale-95 sm:opacity-0"
        }`}
      >
        {displayed && <DetailContent product={displayed} closeButtonRef={closeButtonRef} onClose={onClose} dragHandlers={{ onPointerDown: onDragStart, onPointerMove: onDragMove, onPointerUp: onDragEnd, onPointerCancel: onDragEnd }} />}
      </div>
    </>
  );
}

interface DetailContentProps {
  product: Product;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  dragHandlers: {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
}

function DetailContent({ product, closeButtonRef, onClose, dragHandlers }: DetailContentProps) {
  const { isSoldOut, stockNote } = useProductCart(product);

  return (
    <>
      {/* Tirador (solo celular): zona de arrastre para cerrar. */}
      <div
        {...dragHandlers}
        className="absolute inset-x-0 top-0 z-10 flex h-7 cursor-grab touch-none justify-center pt-2 sm:hidden"
      >
        <span className="h-1.5 w-10 rounded-full bg-zinc-900/20" />
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-zinc-700 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white active:scale-90"
      >
        <X size={20} />
      </button>

      <div className="flex-1 overflow-y-auto overscroll-contain">
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

      <div className="border-t border-zinc-100 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
        <AddToCartControl product={product} size="sheet" />
      </div>
    </>
  );
}
