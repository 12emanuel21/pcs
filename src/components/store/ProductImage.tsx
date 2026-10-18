import ImageWithFallback from "@/components/store/ImageWithFallback";

interface ProductImageProps {
  src: string | null | undefined;
  name: string;
  // "card": tarjeta del catálogo; "thumb": miniatura del carrito.
  size?: "card" | "thumb";
  // Se aplica a la foto y al recuadro de respaldo (ej. gris si está agotado).
  className?: string;
}

// Primera letra visible del nombre (respeta tildes y emojis).
function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toLocaleUpperCase("es") ?? "";
}

// Foto del producto. Sin foto, o si la URL no carga, muestra un recuadro con
// un tono suave del color de la tienda y la inicial del producto.
export default function ProductImage({
  src,
  name,
  size = "card",
  className = "",
}: ProductImageProps) {
  const fallback = (
    <div
      aria-hidden
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/10 to-brand/20 dark:from-brand/15 dark:to-brand/25 ${className}`}
    >
      <span
        className={`font-semibold text-brand-ink select-none ${
          size === "card" ? "text-5xl sm:text-6xl" : "text-xl"
        }`}
      >
        {initialOf(name)}
      </span>
    </div>
  );

  return (
    <ImageWithFallback
      src={src}
      alt={size === "card" ? name : ""}
      fallback={fallback}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
