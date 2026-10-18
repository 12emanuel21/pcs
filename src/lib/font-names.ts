// Tipografías disponibles para la vitrina. Módulo sin next/font para poder
// validarlas en Server Actions sin cargar las fuentes (ver lib/fonts.ts).
export const STORE_FONT_NAMES = [
  "Inter",
  "Roboto",
  "Poppins",
  "Playfair Display",
  "Oswald",
  "Outfit",
] as const;

export type StoreFontName = (typeof STORE_FONT_NAMES)[number];

export const DEFAULT_STORE_FONT: StoreFontName = "Inter";

export function isStoreFontName(value: unknown): value is StoreFontName {
  return (
    typeof value === "string" &&
    (STORE_FONT_NAMES as readonly string[]).includes(value)
  );
}
