import ImageWithFallback from "@/components/store/ImageWithFallback";

interface StoreLogoProps {
  name: string;
  logoUrl: string | null | undefined;
  className?: string;
  // Colores del recuadro con la inicial (por defecto, el color de marca).
  fallbackClassName?: string;
}

// Logo de la tienda; sin logo (o si no carga), la inicial sobre el color de
// marca. El tamaño y la forma los define className.
export default function StoreLogo({
  name,
  logoUrl,
  className = "",
  fallbackClassName = "bg-brand text-brand-fg",
}: StoreLogoProps) {
  return (
    <ImageWithFallback
      src={logoUrl}
      alt={name}
      loading="eager"
      className={`bg-white object-cover ${className}`}
      fallback={
        <span
          aria-hidden
          className={`flex items-center justify-center font-bold ${fallbackClassName} ${className}`}
        >
          {Array.from(name.trim())[0]?.toLocaleUpperCase("es")}
        </span>
      }
    />
  );
}
