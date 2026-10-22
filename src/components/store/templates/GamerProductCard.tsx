"use client";

import AddToCartControl, { useProductCart } from "@/components/store/AddToCartControl";
import ProductImage from "@/components/store/ProductImage";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/types";

interface GamerProductCardProps {
  product: Product;
  // Abre la hoja de detalle (al tocar la foto o el nombre).
  onOpenDetail: (product: Product) => void;
}

// Tarjeta de la plantilla gamer: caja oscura con borde sutil que se ilumina
// con el color de marca al pasar el cursor, foto sobre negro translúcido
// (pensada para fotos con fondo removido), precio en color de marca y control
// de carrito con contorno. Lógica de carrito y stock compartida con la
// tarjeta minimalista (useProductCart / AddToCartControl).
export default function GamerProductCard({ product, onOpenDetail }: GamerProductCardProps) {
  const { isSoldOut, stockNote } = useProductCart(product);
  const openDetail = () => onOpenDetail(product);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-[border-color,box-shadow] duration-200 hover:border-brand hover:shadow-[0_0_18px_var(--color-brand)] hover:shadow-brand/35">
      {/* La foto repite la acción del nombre: fuera del orden de tabulación
          para no recorrerla dos veces con el teclado. */}
      <button
        type="button"
        onClick={openDetail}
        tabIndex={-1}
        aria-label={`Ver detalle de ${product.name}`}
        data-detail-trigger
        className="relative block aspect-square w-full bg-black/50"
      >
        <ProductImage
          src={product.image_url}
          name={product.name}
          blend={false}
          className={isSoldOut ? "opacity-40 grayscale" : ""}
        />
        {isSoldOut && (
          <span className="absolute top-2 left-2 rounded-sm border border-zinc-700 bg-zinc-950/90 px-2 py-0.5 text-[13px] font-semibold text-zinc-300">
            Agotado
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h2 className="text-[15px] leading-snug font-semibold text-zinc-100">
          <button
            type="button"
            onClick={openDetail}
            data-detail-trigger
            className="line-clamp-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {product.name}
          </button>
        </h2>

        <div className="mt-auto pt-2">
          {stockNote && (
            <p className="text-[13px] font-medium text-amber-400">{stockNote}</p>
          )}
          <p className="text-lg font-bold tabular-nums tracking-tight text-brand">
            {formatCOP(product.price)}
          </p>
          <AddToCartControl product={product} tone="outline" className="mt-3" />
        </div>
      </div>
    </article>
  );
}
