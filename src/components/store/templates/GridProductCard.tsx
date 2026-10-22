"use client";

import AddToCartControl, { useProductCart } from "@/components/store/AddToCartControl";
import ProductColors from "@/components/store/ProductColors";
import ProductImage from "@/components/store/ProductImage";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/types";

interface GridProductCardProps {
  product: Product;
  // Abre la hoja de detalle (al tocar la foto o el nombre).
  onOpenDetail: (product: Product) => void;
}

// Tarjeta del catálogo denso: la menor altura posible. Foto cuadrada
// pequeña (ProductImage, que usa ImageWithFallback con la inicial de
// respaldo), nombre en hasta 2 líneas, precio y un control de 32px. Sin
// categoría ni descripción: están en la hoja de detalle.
export default function GridProductCard({ product, onOpenDetail }: GridProductCardProps) {
  const { isSoldOut, stockNote } = useProductCart(product);
  const openDetail = () => onOpenDetail(product);

  return (
    <article className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      {/* La foto repite la acción del nombre: fuera del orden de tabulación
          para no recorrerla dos veces con el teclado. */}
      <button
        type="button"
        onClick={openDetail}
        tabIndex={-1}
        aria-label={`Ver detalle de ${product.name}`}
        data-detail-trigger
        className="stage relative block aspect-square w-full overflow-hidden rounded-md bg-stage"
      >
        <ProductImage
          src={product.image_url}
          name={product.name}
          size="thumb"
          className={isSoldOut ? "opacity-50 grayscale" : ""}
        />
        {isSoldOut && (
          <span className="absolute top-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
            Agotado
          </span>
        )}
      </button>

      {/* min-h de 2 líneas: precio y botón quedan alineados en cada fila
          aunque un nombre ocupe una sola línea. */}
      <h2 className="mt-1.5 min-h-[2.75em] text-xs leading-snug font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        <button
          type="button"
          onClick={openDetail}
          data-detail-trigger
          className="line-clamp-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {product.name}
        </button>
      </h2>

      <div className="mt-auto pt-1">
        <ProductColors colors={product.colors} className="mb-1" />
        {stockNote && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{stockNote}</p>
        )}
        <p className="text-sm font-bold tabular-nums tracking-tight text-zinc-900 sm:text-base dark:text-white">
          {formatCOP(product.price)}
        </p>
        <AddToCartControl product={product} size="compact" className="mt-1.5" />
      </div>
    </article>
  );
}
