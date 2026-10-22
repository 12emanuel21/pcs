import type { Store } from "@/types";

// Plantillas visuales de la vitrina pública. El valor se guarda en
// stores.template; la vitrina elige el componente con él (ver
// components/store/StorefrontTemplate.tsx).
export const STORE_TEMPLATES = ["minimal", "gamer", "grid"] as const;
export type StoreTemplate = (typeof STORE_TEMPLATES)[number];

export const DEFAULT_TEMPLATE: StoreTemplate = "minimal";

export const TEMPLATE_LABELS: Record<StoreTemplate, string> = {
  minimal: "Minimalista (Actual)",
  gamer: "Gamer (Oscuro/Impactante)",
  grid: "Catálogo (Denso)",
};

export function isStoreTemplate(value: unknown): value is StoreTemplate {
  return typeof value === "string" && (STORE_TEMPLATES as readonly string[]).includes(value);
}

// Valores ausentes o desconocidos usan la plantilla por defecto.
export function resolveTemplate(value: string | null | undefined): StoreTemplate {
  return isStoreTemplate(value) ? value : DEFAULT_TEMPLATE;
}

// Límites del texto de la portada (se validan en el servidor).
export const HERO_TITLE_MAX = 60;
export const HERO_SUBTITLE_MAX = 140;

// Datos de la portada que recibe la vitrina. null = sin portada.
export interface StoreHero {
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
}

// La portada solo existe si tiene título o imagen (un subtítulo suelto no
// basta para mostrar un bloque).
export function getStoreHero(
  store: Pick<Store, "hero_title" | "hero_subtitle" | "hero_image_url">,
): StoreHero | null {
  const title = store.hero_title?.trim() || null;
  const subtitle = store.hero_subtitle?.trim() || null;
  const imageUrl = store.hero_image_url?.trim() || null;
  if (!title && !imageUrl) return null;
  return { title, subtitle, imageUrl };
}
