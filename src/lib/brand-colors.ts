import type { CSSProperties } from "react";

// Paleta de marca derivada de store.theme_color, legible en modo claro y
// oscuro sin importar el color que elija el comerciante:
// - texto blanco o casi negro según cuál contraste más con el color;
// - en modo oscuro, si el color es muy oscuro (ej. el #18181B por defecto),
//   se aclara mezclándolo con blanco hasta que destaque sobre el fondo.

const FALLBACK = "#18181B";
const DARK_TEXT = "#18181B";
const LIGHT_TEXT = "#FFFFFF";
const DARK_SURFACE = "#0F172A"; // slate-900, fondo de las tarjetas en oscuro
const MIN_SURFACE_CONTRAST = 3; // WCAG para componentes de interfaz

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  let value = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    value = value.replace(/./g, (c) => c + c);
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) return parseHex(FALLBACK);
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Blanco si alcanza 3:1 (texto en negrita de botones; es lo que se espera
// sobre colores medios como verdes o rojos); si no, el de mayor contraste.
function readableText(background: Rgb): string {
  const onWhite = contrast(background, parseHex(LIGHT_TEXT));
  if (onWhite >= MIN_SURFACE_CONTRAST) return LIGHT_TEXT;
  return onWhite >= contrast(background, parseHex(DARK_TEXT)) ? LIGHT_TEXT : DARK_TEXT;
}

function mixWithWhite([r, g, b]: Rgb, amount: number): Rgb {
  return [r, g, b].map((c) => c + (255 - c) * amount) as Rgb;
}

export function getBrandPalette(themeColor: string | null | undefined) {
  const brand = parseHex(themeColor ?? FALLBACK);
  const surface = parseHex(DARK_SURFACE);

  let brandDark = brand;
  for (let step = 1; step <= 10 && contrast(brandDark, surface) < MIN_SURFACE_CONTRAST; step++) {
    brandDark = mixWithWhite(brand, step * 0.1);
  }

  return {
    brand: toHex(brand),
    brandFg: readableText(brand),
    brandDark: toHex(brandDark),
    brandDarkFg: readableText(brandDark),
  };
}

// Variables CSS para el contenedor .brand-scope (ver globals.css).
export function brandStyle(themeColor: string | null | undefined): CSSProperties {
  const palette = getBrandPalette(themeColor);
  return {
    "--brand": palette.brand,
    "--brand-fg": palette.brandFg,
    "--brand-dark": palette.brandDark,
    "--brand-dark-fg": palette.brandDarkFg,
  } as CSSProperties;
}
