import {
  Anton,
  Inter,
  Oswald,
  Outfit,
  Playfair_Display,
  Poppins,
  Roboto,
} from "next/font/google";
import {
  DEFAULT_STORE_FONT,
  isStoreFontName,
  type StoreFontName,
} from "@/lib/font-names";

// preload: false en todas: next/font solo declara las @font-face y el
// navegador descarga únicamente la fuente que la tienda usa de verdad (con
// preload, cada visita bajaría todas).
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });
const roboto = Roboto({ subsets: ["latin"], display: "swap", preload: false });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const oswald = Oswald({ subsets: ["latin"], display: "swap", preload: false });
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false });
// Anton: condensada y ultra pesada, para titulares de impacto. Solo existe
// en peso 400 (que ya se ve como un 900).
const anton = Anton({ subsets: ["latin"], weight: "400", display: "swap", preload: false });

export const STORE_FONTS: Record<StoreFontName, { className: string }> = {
  Inter: inter,
  Roboto: roboto,
  Poppins: poppins,
  "Playfair Display": playfair,
  Oswald: oswald,
  Outfit: outfit,
  // Sin negrita sintética: Anton no tiene pesos mayores y el navegador la
  // engrosaría a la fuerza (se ve borrosa) en los textos font-bold/black.
  Anton: { className: `${anton.className} [font-synthesis-weight:none]` },
};

// Clase CSS de la fuente de la tienda. Valores antiguos o desconocidos (ej.
// "sans-serif" de tiendas creadas antes) usan la fuente por defecto.
export function storeFontClassName(fontFamily: string | null | undefined): string {
  return STORE_FONTS[isStoreFontName(fontFamily) ? fontFamily : DEFAULT_STORE_FONT]
    .className;
}
