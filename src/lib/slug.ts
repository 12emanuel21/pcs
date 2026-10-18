// El slug es el id de la tienda y su URL pública (/{slug}), así que no puede
// coincidir con rutas propias de la app.
const RESERVED_SLUGS = new Set([
  "admin",
  "superadmin",
  "api",
  "login",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

// Devuelve un mensaje de error o null si el slug es válido.
export function validateSlug(slug: string): string | null {
  if (slug.length < 3 || slug.length > 50) {
    return "El slug debe tener entre 3 y 50 caracteres.";
  }
  if (!SLUG_PATTERN.test(slug)) {
    return "El slug solo puede tener minúsculas, números y guiones (ej: compuparque-104).";
  }
  if (RESERVED_SLUGS.has(slug)) {
    return `"${slug}" es una ruta reservada de la plataforma. Elige otro slug.`;
  }
  return null;
}
