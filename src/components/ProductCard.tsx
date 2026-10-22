"use client";

import AddToCartControl, { useProductCart } from "@/components/store/AddToCartControl";
import ProductColors from "@/components/store/ProductColors";
import ProductImage from "@/components/store/ProductImage";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  // Abre la hoja de detalle (al tocar la foto o el nombre).
  onOpenDetail: (product: Product) => void;
}

// Tarjeta sin marco: la foto completa sobre la vitrina (bg-stage) es la
// protagonista; debajo, nombre, precio y el botón. Los colores de marca
// (bg-brand, text-brand-fg) vienen del contenedor .brand-scope.
export default function ProductCard({ product, onOpenDetail }: ProductCardProps) {
  const { isSoldOut, stockNote } = useProductCart(product);
  const openDetail = () => onOpenDetail(product);

  return (
    <article className="flex h-full flex-col">
      {/* La foto repite la acción del nombre: fuera del orden de tabulación
          para no recorrerla dos veces con el teclado. */}
      <button
        type="button"
        onClick={openDetail}
        tabIndex={-1}
        aria-label={`Ver detalle de ${product.name}`}
        data-detail-trigger
        className="stage relative block aspect-square w-full overflow-hidden rounded-3xl bg-stage transition-transform duration-200 active:scale-[0.98]"
      >
        <ProductImage
          src={product.image_url}
          name={product.name}
          className={isSoldOut ? "opacity-50 grayscale" : ""}
        />
        {isSoldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[13px] font-medium text-zinc-700">
            Agotado
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <h2 className="text-[15px] leading-snug font-medium text-zinc-900 dark:text-zinc-100">
          <button
            type="button"
            onClick={openDetail}
            data-detail-trigger
            className="line-clamp-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {product.name}
          </button>
        </h2>

        <div className="mt-auto pt-1">
          <ProductColors colors={product.colors} className="mb-1.5" />
          {stockNote && (
            <p className="text-[13px] font-medium text-amber-700 dark:text-amber-400">
              {stockNote}
            </p>
          )}
          <p className="text-base font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
            {formatCOP(product.price)}
          </p>
          <AddToCartControl product={product} className="mt-3" />
        </div>
      </div>
    </article>
  );
}
