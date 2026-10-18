"use server";

import { revalidatePath } from "next/cache";
import { getOwnerStore } from "@/lib/auth";

export interface ActionResult {
  error: string | null;
}

const MAX_SUBJECT = 150;
const MAX_MESSAGE = 5000;

export async function createSupportTicket(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!subject) return { error: "El asunto es obligatorio." };
  if (!message) return { error: "Describe tu solicitud en el mensaje." };
  if (subject.length > MAX_SUBJECT) {
    return { error: `El asunto no puede superar ${MAX_SUBJECT} caracteres.` };
  }
  if (message.length > MAX_MESSAGE) {
    return { error: `El mensaje no puede superar ${MAX_MESSAGE} caracteres.` };
  }

  const { error } = await ctx.supabase.from("support_tickets").insert({
    store_id: ctx.storeId,
    subject,
    message,
    status: "OPEN",
  });

  if (error) return { error: "No se pudo enviar el ticket." };

  revalidatePath("/admin/support");
  revalidatePath("/superadmin/tickets");
  return { error: null };
}
