import ImageWithFallback from "@/components/store/ImageWithFallback";

interface ProductImageProps {
  src: string | null | undefined;
  name: string;
  // "card": tarjeta del catálogo; "detail": hoja de detalle; "thumb":
  // miniatura del carrito.
  size?: "card" | "detail" | "thumb";
  // Se aplica a la foto y al recuadro de respaldo (ej. gris si está agotado).
  className?: string;
  // Fundir la foto con la vitrina clara (multiply). false sobre fondos
  // oscuros (plantilla gamer), donde multiply dejaría la foto negra.
  blend?: boolean;
}

// Primera letra visible del nombre (respeta tildes y emojis).
function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toLocaleUpperCase("es") ?? "";
}

const PADDING = { card: "p-3", detail: "p-6", thumb: "p-1" } as const;
const INITIAL_SIZE = {
  card: "text-5xl sm:text-6xl",
  detail: "text-7xl",
  thumb: "text-xl",
} as const;

// Foto del producto completa (sin recortar) para apoyarla sobre la vitrina
// (bg-stage, ver globals.css): mix-blend-multiply funde el fondo blanco de la
// foto con el de la vitrina. Sin foto, o si la URL no carga, muestra la
// inicial sobre un tono suave del color de la tienda.
export default function ProductImage({
  src,
  name,
  size = "card",
  className = "",
  blend = true,
}: ProductImageProps) {
  const fallback = (
    <div
      aria-hidden
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/10 to-brand/20 ${className}`}
    >
      <span className={`font-semibold text-brand-ink select-none ${INITIAL_SIZE[size]}`}>
        {initialOf(name)}
      </span>
    </div>
  );

  return (
    <ImageWithFallback
      src={src}
      alt={size === "thumb" ? "" : name}
      fallback={fallback}
      className={`h-full w-full object-contain ${blend ? "mix-blend-multiply" : ""} ${PADDING[size]} ${className}`}
    />
  );
}
