"use client";

import { useState, type ReactNode } from "react";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  // Lo que se muestra si no hay imagen o si no carga (URL rota o inválida).
  fallback: ReactNode;
  loading?: "lazy" | "eager";
}

// <img> que nunca muestra el ícono roto del navegador.
export default function ImageWithFallback({
  src,
  alt,
  className,
  fallback,
  loading = "lazy",
}: ImageWithFallbackProps) {
  // Se guarda qué src falló (no un booleano) para que, si cambia el src, se
  // vuelva a intentar sin tener que reiniciar el estado.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      // La imagen puede fallar antes de que React hidrate y entonces onError
      // no se dispara: al montar se revisa si ya terminó de cargar sin datos.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
      }}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
