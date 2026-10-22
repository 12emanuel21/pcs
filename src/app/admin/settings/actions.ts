"use server";

import { revalidatePath } from "next/cache";
import { getOwnerOnlyStore } from "@/lib/auth";
import { normalizeHexColor } from "@/lib/colors";
import { isStoreFontName } from "@/lib/font-names";
import { isThemeOption } from "@/lib/theme";
import { parseImageField } from "@/lib/images";
import { removeStoreImage } from "@/lib/storage";
import { HERO_SUBTITLE_MAX, HERO_TITLE_MAX, isStoreTemplate } from "@/lib/templates";
import { normalizeWhatsApp } from "@/lib/whatsapp";

export interface SettingsResult {
  error: string | null;
}

export async function updateStoreSettings(
  formData: FormData,
): Promise<SettingsResult> {
  // Solo el dueño: los empleados (STAFF) no pueden cambiar los ajustes.
  const ctx = await getOwnerOnlyStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre de la tienda es obligatorio." };

  const whatsapp = normalizeWhatsApp(String(formData.get("whatsapp_number") ?? ""));
  if (!whatsapp) {
    return {
      error:
        "El número de WhatsApp no es válido. Usa tu celular con indicativo, ej: 573001234567.",
    };
  }

  const themeColor = normalizeHexColor(String(formData.get("theme_color") ?? ""));
  if (!themeColor) {
    return { error: "El color debe ser un código hexadecimal, ej: #E11D48." };
  }

  const fontFamily = String(formData.get("font_family") ?? "");
  if (!isStoreFontName(fontFamily)) {
    return { error: "Elige una tipografía de la lista." };
  }

  const defaultTheme = String(formData.get("default_theme") ?? "system");
  if (!isThemeOption(defaultTheme)) {
    return { error: "Elige un tema por defecto válido." };
  }

  const template = String(formData.get("template") ?? "");
  if (!isStoreTemplate(template)) {
    return { error: "Elige una plantilla de la lista." };
  }

  // Textos de la portada: vacíos = sin texto (null).
  const heroTitle = String(formData.get("hero_title") ?? "").trim();
  if (heroTitle.length > HERO_TITLE_MAX) {
    return { error: `El título de la portada admite hasta ${HERO_TITLE_MAX} caracteres.` };
  }
  const heroSubtitle = String(formData.get("hero_subtitle") ?? "").trim();
  if (heroSubtitle.length > HERO_SUBTITLE_MAX) {
    return {
      error: `El subtítulo de la portada admite hasta ${HERO_SUBTITLE_MAX} caracteres.`,
    };
  }

  // Producto estrella de la portada: vacío = automático. Debe ser de esta
  // tienda (el id llega del navegador).
  const featuredProductId = String(formData.get("featured_product_id") ?? "").trim() || null;
  if (featuredProductId) {
    const { data: featured } = await ctx.supabase
      .from("products")
      .select("id")
      .eq("id", featuredProductId)
      .eq("store_id", ctx.storeId)
      .maybeSingle();
    if (!featured) return { error: "El producto estrella no existe en tu tienda." };
  }

  // El formulario envía el logo en "image_url" y la portada en
  // "hero_image_url" (los arma resolveImageField).
  const logo = parseImageField(formData);
  if ("error" in logo) return { error: logo.error };
  const hero = parseImageField(formData, "hero_image_url");
  if ("error" in hero) return { error: hero.error };

  // undefined = sin imagen nueva: se conserva la actual.
  const previousLogo = ctx.store.logo_url ?? null;
  const logoUrl = logo.value === undefined ? previousLogo : logo.value;
  const previousHero = ctx.store.hero_image_url ?? null;
  const heroImageUrl = hero.value === undefined ? previousHero : hero.value;

  const { data, error } = await ctx.supabase
    .from("stores")
    .update({
      name,
      whatsapp_number: whatsapp,
      theme_color: themeColor,
      font_family: fontFamily,
      default_theme: defaultTheme,
      logo_url: logoUrl,
      template,
      hero_title: heroTitle || null,
      hero_subtitle: heroSubtitle || null,
      hero_image_url: heroImageUrl,
      featured_product_id: featuredProductId,
    })
    .eq("id", ctx.storeId)
    .select("id");

  // RLS puede bloquear el update sin devolver error: se valida que afectó 1 fila.
  if (error || !data?.length) {
    return { error: "No se pudieron guardar los cambios." };
  }

  if (logoUrl !== previousLogo) {
    await removeStoreImage(ctx.supabase, ctx.storeId, previousLogo);
  }
  if (heroImageUrl !== previousHero) {
    await removeStoreImage(ctx.supabase, ctx.storeId, previousHero);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath(`/${ctx.storeId}`);
  return { error: null };
}
