// Validación del cargue masivo de productos. Se usa en el navegador (para la
// previsualización) y de nuevo en el servidor, que no confía en el cliente.
import { isHttpUrl } from "@/lib/images";

export const MAX_IMPORT_ROWS = 500;
export const MAX_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_CATEGORY_LENGTH = 50;
export const MAX_STOCK = 1_000_000;

export const TEMPLATE_COLUMNS = [
  "name",
  "description",
  "price",
  "category",
  "stock",
  "image_url",
] as const;

export interface ImportProductInput {
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number | null;
}

// Encabezados aceptados (en minúsculas, sin tildes) para cada columna, para
// que también funcionen plantillas escritas en español.
const HEADER_ALIASES: Record<string, (typeof TEMPLATE_COLUMNS)[number]> = {
  name: "name",
  nombre: "name",
  producto: "name",
  description: "description",
  descripcion: "description",
  price: "price",
  precio: "price",
  valor: "price",
  image_url: "image_url",
  imagen: "image_url",
  image: "image_url",
  url_imagen: "image_url",
  category: "category",
  categoria: "category",
  stock: "stock",
  inventario: "stock",
  existencias: "stock",
  cantidad: "stock",
};

export function normalizeHeader(header: string): string {
  const key = header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\s+/g, "_");
  return HEADER_ALIASES[key] ?? key;
}

// Precios en COP como los escribe Excel: "150000", "150.000", "$ 150.000",
// "150,000" o "150000.00". Devuelve un entero o null si no es un número.
export function parsePrice(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : null;
  }
  let value = String(raw ?? "").trim().replace(/[$\s]|COP/gi, "");
  if (!value) return null;

  // Parte decimal de 1-2 dígitos al final ("150000.00", "1500,5"): se descarta,
  // el peso colombiano no usa centavos. Grupos de 3 dígitos son miles.
  value = value.replace(/[.,]\d{1,2}$/, "");
  if (!/^\d{1,3}([.,]?\d{3})*$|^\d+$/.test(value)) return null;

  const price = Number(value.replace(/[.,]/g, ""));
  return Number.isSafeInteger(price) ? price : null;
}

// Valida una fila. Devuelve el producto limpio o el motivo del rechazo.
export function validateImportRow(
  row: Record<string, unknown>,
): { product: ImportProductInput } | { error: string } {
  const name = String(row.name ?? "").trim();
  const description = String(row.description ?? "").trim();
  const imageUrl = String(row.image_url ?? "").trim();
  const category = normalizeCategory(row.category);
  const stock = parseStock(row.stock);
  const price = parsePrice(row.price);

  if (!name) return { error: "Falta el nombre" };
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Nombre de más de ${MAX_NAME_LENGTH} caracteres` };
  }
  if (row.price === undefined || String(row.price).trim() === "") {
    return { error: "Falta el precio" };
  }
  if (price === null) return { error: `Precio inválido: "${row.price}"` };
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Descripción de más de ${MAX_DESCRIPTION_LENGTH} caracteres` };
  }
  if (imageUrl && !isHttpUrl(imageUrl)) {
    return { error: "image_url debe empezar por http:// o https://" };
  }
  if (category && category.length > MAX_CATEGORY_LENGTH) {
    return { error: `Categoría de más de ${MAX_CATEGORY_LENGTH} caracteres` };
  }
  if (stock === "invalid") return { error: `Stock inválido: "${row.stock}"` };

  return {
    product: {
      name,
      description,
      price,
      image_url: imageUrl || null,
      category,
      stock,
    },
  };
}

// Stock: vacío -> null (ilimitado); entero >= 0 (acepta "1.000"); si no,
// "invalid".
export function parseStock(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  const stock = parsePrice(raw);
  if (stock === null || stock > MAX_STOCK) return "invalid";
  return stock;
}

// Categoría limpia: sin espacios extra; vacía -> null.
export function normalizeCategory(raw: unknown): string | null {
  const value = String(raw ?? "").trim().replace(/\s+/g, " ");
  return value || null;
}

// Separador de la plantilla: ";" es el separador de listas de Excel en
// español (Colombia), así el archivo abre en columnas con doble clic.
export const TEMPLATE_DELIMITER = ";";

function csvField(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// CSV de ejemplo para descargar: separador ";" y BOM UTF-8 para que Excel
// lea bien las tildes.
export function buildTemplateCsv(): string {
  const examples = [
    ["Mouse inalámbrico", "Mouse óptico 1600 DPI, color negro", "45000", "Accesorios", "12", "https://ejemplo.com/mouse.jpg"],
    ["Teclado mecánico", "Switches azules con luz RGB", "189900", "Accesorios", "3", ""],
    ["Cable HDMI 2m", "", "15000", "Cables", "", ""],
  ];
  const rows = [TEMPLATE_COLUMNS, ...examples].map((row) =>
    row.map(csvField).join(TEMPLATE_DELIMITER),
  );
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}
