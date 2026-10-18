"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSuperAdminActionContext, IMPERSONATE_COOKIE } from "@/lib/auth";
import { DEFAULT_STORE_FONT } from "@/lib/font-names";
import { validateSlug } from "@/lib/slug";
import { isValidDateString, toSubscriptionEnd } from "@/lib/store-utils";
import { normalizeWhatsApp } from "@/lib/whatsapp";
import { TICKET_STATUSES, type TicketStatus } from "@/types";

export interface ActionResult {
  error: string | null;
}

const DEFAULT_THEME_COLOR = "#18181B";
const MIN_PASSWORD_LENGTH = 8;
const IMPERSONATE_MAX_AGE = 60 * 60 * 8; // 8 horas

export async function createMerchantAndStore(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getSuperAdminActionContext();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const whatsapp = normalizeWhatsApp(String(formData.get("whatsapp_number") ?? ""));

  if (!name) return { error: "El nombre de la tienda es obligatorio." };
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError };
  if (!whatsapp) {
    return {
      error: "El WhatsApp no es válido. Usa el número con indicativo, ej: 573001234567.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El email del dueño no es válido." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La contraseña inicial debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  // Se valida el slug antes de crear el usuario para no dejar cuentas huérfanas.
  const { data: existing } = await ctx.admin
    .from("stores")
    .select("id")
    .eq("id", slug)
    .maybeSingle();
  if (existing) return { error: `El slug "${slug}" ya está en uso.` };

  const { data: created, error: userError } = await ctx.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !created.user) {
    const alreadyExists = userError?.message.toLowerCase().includes("already");
    return {
      error: alreadyExists
        ? "Ya existe un usuario con ese email."
        : `No se pudo crear el usuario: ${userError?.message ?? "error desconocido"}`,
    };
  }

  const { error: storeError } = await ctx.admin.from("stores").insert({
    id: slug,
    owner_id: created.user.id,
    name,
    whatsapp_number: whatsapp,
    theme_color: DEFAULT_THEME_COLOR,
    font_family: DEFAULT_STORE_FONT,
    is_active: true,
  });

  if (storeError) {
    // Rollback: sin tienda, el usuario recién creado no sirve.
    await ctx.admin.auth.admin.deleteUser(created.user.id);
    return { error: `No se pudo crear la tienda: ${storeError.message}` };
  }

  revalidatePath("/superadmin");
  return { error: null };
}

export async function toggleStoreStatus(
  storeId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const ctx = await getSuperAdminActionContext();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const { data, error } = await ctx.admin
    .from("stores")
    .update({ is_active: !isActive })
    .eq("id", storeId)
    .select("id");

  if (error || !data?.length) {
    return { error: "No se pudo cambiar el estado de la tienda." };
  }

  revalidatePath("/superadmin");
  revalidatePath("/admin");
  revalidatePath(`/${storeId}`);
  return { error: null };
}

// endDate: "YYYY-MM-DD" (la tienda funciona todo ese día, hora de Bogotá)
// o null para una suscripción ilimitada.
export async function updateSubscriptionDate(
  storeId: string,
  endDate: string | null,
): Promise<ActionResult> {
  const ctx = await getSuperAdminActionContext();
  if ("error" in ctx) return { error: ctx.error ?? null };

  if (endDate !== null && !isValidDateString(endDate)) {
    return { error: "La fecha de vencimiento no es válida." };
  }

  const { data, error } = await ctx.admin
    .from("stores")
    .update({ subscription_end: endDate ? toSubscriptionEnd(endDate) : null })
    .eq("id", storeId)
    .select("id");

  if (error || !data?.length) {
    return { error: "No se pudo actualizar el vencimiento." };
  }

  revalidatePath("/superadmin");
  revalidatePath("/admin");
  revalidatePath(`/${storeId}`);
  return { error: null };
}

export async function startImpersonation(storeId: string) {
  const ctx = await getSuperAdminActionContext();
  if ("error" in ctx) redirect("/superadmin");

  const { data: store } = await ctx.admin
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) redirect("/superadmin");

  (await cookies()).set(IMPERSONATE_COOKIE, storeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATE_MAX_AGE,
  });

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function stopImpersonation() {
  (await cookies()).delete(IMPERSONATE_COOKIE);

  revalidatePath("/admin", "layout");
  redirect("/superadmin");
}

export async function replyToTicket(
  ticketId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getSuperAdminActionContext();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const reply = String(formData.get("admin_reply") ?? "").trim();
  const status = String(formData.get("status") ?? "") as TicketStatus;

  if (!TICKET_STATUSES.includes(status)) {
    return { error: "Estado de ticket no válido." };
  }

  const { data, error } = await ctx.admin
    .from("support_tickets")
    .update({ admin_reply: reply || null, status })
    .eq("id", ticketId)
    .select("id");

  if (error || !data?.length) {
    return { error: "No se pudo guardar la respuesta." };
  }

  revalidatePath("/superadmin/tickets");
  revalidatePath("/admin/support");
  return { error: null };
}
