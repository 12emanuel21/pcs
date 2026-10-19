"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSuperAdminActionContext, IMPERSONATE_COOKIE } from "@/lib/auth";
import { DEFAULT_STORE_FONT } from "@/lib/font-names";
import { validateSlug } from "@/lib/slug";
import {
  addDaysToDate,
  getSubscriptionEndDate,
  getTodayDate,
  isValidDateString,
  toSubscriptionEnd,
} from "@/lib/store-utils";
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

export interface ExtendSubscriptionResult extends ActionResult {
  // Nueva fecha de corte (YYYY-MM-DD, Bogotá) si la renovación se aplicó.
  newEndDate?: string;
  // true si la tienda estaba suspendida manualmente y quedó activa.
  reactivated?: boolean;
}

const MAX_DAYS_TO_ADD = 366;

// Renovación rápida (pago recibido): suma daysToAdd al vencimiento.
// - Vigente (vence hoy o después): se suma a la fecha de vencimiento actual,
//   así no se pierden los días que quedaban (2 días + 31 = 33).
// - Vencida o sin fecha (null): se suma desde hoy (calendario de Bogotá).
// Renovar equivale a pagar, así que además deja la tienda activa
// (is_active = true) aunque estuviera suspendida manualmente.
export async function extendSubscription(
  storeId: string,
  daysToAdd: number = 31,
): Promise<ExtendSubscriptionResult> {
  const ctx = await getSuperAdminActionContext();
  if ("error" in ctx) return { error: ctx.error ?? null };

  if (!Number.isInteger(daysToAdd) || daysToAdd < 1 || daysToAdd > MAX_DAYS_TO_ADD) {
    return { error: `Los días a sumar deben estar entre 1 y ${MAX_DAYS_TO_ADD}.` };
  }

  const { data: store, error: readError } = await ctx.admin
    .from("stores")
    .select("id, is_active, subscription_end")
    .eq("id", storeId)
    .maybeSingle<{ id: string; is_active: boolean; subscription_end: string | null }>();

  if (readError || !store) return { error: "No se encontró la tienda." };

  const today = getTodayDate();
  const currentEnd = getSubscriptionEndDate(store);
  // Las fechas YYYY-MM-DD se comparan bien como texto.
  const base = currentEnd && currentEnd >= today ? currentEnd : today;
  const newEndDate = addDaysToDate(base, daysToAdd);

  // Escritura condicional: solo si el vencimiento sigue siendo el que se
  // leyó. Así un doble clic (o dos pestañas) no suma los días dos veces.
  let update = ctx.admin
    .from("stores")
    .update({ subscription_end: toSubscriptionEnd(newEndDate), is_active: true })
    .eq("id", storeId);
  update =
    store.subscription_end === null
      ? update.is("subscription_end", null)
      : update.eq("subscription_end", store.subscription_end);

  const { data, error } = await update.select("id");

  if (error) return { error: "No se pudo renovar la suscripción." };
  if (!data?.length) {
    return {
      error: "El vencimiento cambió mientras tanto (¿doble clic?). Revisa la fecha antes de renovar de nuevo.",
    };
  }

  revalidatePath("/superadmin");
  revalidatePath("/admin");
  revalidatePath(`/${storeId}`);
  return { error: null, newEndDate, reactivated: store.is_active === false };
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
