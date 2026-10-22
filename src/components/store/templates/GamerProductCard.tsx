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

// Tarjeta de la plantilla gamer: caja oscura con la foto sobre la vitrina
// clara (bg-stage + multiply: las fotos con fondo blanco se funden en vez de
// verse como recuadros blancos), nombre en negrita, una línea de
// descripción y, abajo, el precio grande con el botón compacto al lado.
// Colores explícitos: no hereda del body.
export default function GamerProductCard({ product, onOpenDetail }: GamerProductCardProps) {
  const { isSoldOut, stockNote } = useProductCart(product);
  const openDetail = () => onOpenDetail(product);
  const description = product.description?.trim();

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 transition-colors duration-200 hover:border-zinc-600">
      {/* La foto repite la acción del nombre: fuera del orden de tabulación
          para no recorrerla dos veces con el teclado. */}
      <button
        type="button"
        onClick={openDetail}
        tabIndex={-1}
        aria-label={`Ver detalle de ${product.name}`}
        data-detail-trigger
        className="stage relative m-2 mb-0 block aspect-[4/3] overflow-hidden rounded-xl bg-stage"
      >
        <ProductImage
          src={product.image_url}
          name={product.name}
          className={`transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none ${
            isSoldOut ? "opacity-50 grayscale" : ""
          }`}
        />
        {isSoldOut && (
          <span className="absolute top-2 left-2 rounded-md bg-zinc-950/85 px-2 py-0.5 text-[13px] font-semibold text-zinc-200">
            Agotado
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h2 className="text-[15px] leading-snug font-bold text-zinc-100 sm:text-base">
          <button
            type="button"
            onClick={openDetail}
            data-detail-trigger
            className="line-clamp-2 rounded-sm text-left text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {product.name}
          </button>
        </h2>
        {description && (
          <p className="mt-1 line-clamp-1 text-[13px] text-zinc-400">{description}</p>
        )}
        {stockNote && (
          <p className="mt-1 text-[13px] font-medium text-amber-400">{stockNote}</p>
        )}

        {/* Precio y botón en una fila desde sm; en celular (2 columnas
            angostas) el botón va debajo, a todo el ancho. */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-black tracking-tight text-zinc-50 tabular-nums sm:text-xl">
            {formatCOP(product.price)}
          </p>
          <AddToCartControl product={product} size="compact" className="sm:w-28 sm:shrink-0" />
        </div>
      </div>
    </article>
  );
}
