"use server";

import { revalidatePath } from "next/cache";
import { getOwnerOnlyStore } from "@/lib/auth";
import { isStoreFontName } from "@/lib/font-names";
import { isThemeOption } from "@/lib/theme";
import { parseImageField } from "@/lib/images";
import { removeStoreImage } from "@/lib/storage";
import { normalizeWhatsApp } from "@/lib/whatsapp";

export interface SettingsResult {
  error: string | null;
}

// Acepta #RGB o #RRGGBB y lo devuelve como #RRGGBB en mayúsculas.
function normalizeHexColor(raw: string): string | null {
  const value = raw.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = value.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
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

  // El formulario envía el logo en "image_url" (lo arma resolveImageField).
  const logo = parseImageField(formData);
  if ("error" in logo) return { error: logo.error };

  // undefined = sin logo nuevo: se conserva el actual.
  const previousLogo = ctx.store.logo_url ?? null;
  const logoUrl = logo.value === undefined ? previousLogo : logo.value;

  const { data, error } = await ctx.supabase
    .from("stores")
    .update({
      name,
      whatsapp_number: whatsapp,
      theme_color: themeColor,
      font_family: fontFamily,
      default_theme: defaultTheme,
      logo_url: logoUrl,
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

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath(`/${ctx.storeId}`);
  return { error: null };
}
