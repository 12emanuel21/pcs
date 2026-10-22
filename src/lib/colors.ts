// Colores en formato HEX. Módulo sin dependencias: lo usan Server Actions y
// componentes de cliente.

export const MAX_PRODUCT_COLORS = 12;

// Acepta #RGB o #RRGGBB y lo devuelve como #RRGGBB en mayúsculas.
export function normalizeHexColor(raw: string): string | null {
  const value = raw.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = value.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

// Colores de un producto tal como llegan del formulario: normalizados, sin
// repetidos y como máximo MAX_PRODUCT_COLORS.
export function parseProductColors(
  values: unknown[],
): { colors: string[] } | { error: string } {
  const colors: string[] = [];
  for (const raw of values) {
    const color = normalizeHexColor(String(raw ?? ""));
    if (!color) return { error: "Los colores deben ser códigos hexadecimales, ej: #FFFFFF." };
    if (!colors.includes(color)) colors.push(color);
  }
  if (colors.length > MAX_PRODUCT_COLORS) {
    return { error: `Máximo ${MAX_PRODUCT_COLORS} colores por producto.` };
  }
  return { colors };
}

// Colores válidos de un producto ya guardado (la vitrina no confía en que la
// columna tenga siempre un arreglo de HEX limpios).
export function productColors(colors: unknown): string[] {
  if (!Array.isArray(colors)) return [];
  return colors.filter(
    (color): color is string => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color),
  );
}
