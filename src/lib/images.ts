// Utilidades de imágenes compartidas entre cliente y servidor.

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const STORAGE_PUBLIC_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;

export function isStorageImage(url: string): boolean {
  return url.startsWith(STORAGE_PUBLIC_PREFIX);
}

export function storeImagePrefix(storeId: string): string {
  return `${STORAGE_PUBLIC_PREFIX}${storeId}/`;
}

export function isHttpUrl(value: string): boolean {
  if (value.length > 2048) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Storage rechaza keys con espacios, tildes y algunos símbolos.
export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase();
}

// Lee "image_url" del FormData con este contrato:
// - ausente  -> undefined (conservar la imagen actual)
// - ""       -> null (quitar la imagen)
// - URL      -> la URL nueva
// Devuelve { error } si la URL no es http(s).
export function parseImageField(
  formData: FormData,
  field = "image_url",
): { value: string | null | undefined } | { error: string } {
  if (!formData.has(field)) return { value: undefined };

  const value = String(formData.get(field) ?? "").trim();
  if (!value) return { value: null };
  if (!isHttpUrl(value)) {
    return { error: "El enlace de la imagen debe empezar por http:// o https://." };
  }
  return { value };
}
