"use server";

import { revalidatePath } from "next/cache";
import { getOwnerOnlyStore } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { SUPERADMIN_ROLE } from "@/types";

export interface ActionResult {
  error: string | null;
}

const STAFF_ROLES = ["STAFF"] as const;
const MIN_PASSWORD_LENGTH = 8;

// Crea la cuenta del empleado con una contraseña inicial y la asigna a la
// tienda. Solo crea cuentas NUEVAS: si el email ya existe se rechaza, así un
// dueño nunca puede listar, vincular ni tomar el control de cuentas ajenas.
export async function inviteStaff(formData: FormData): Promise<ActionResult> {
  const ctx = await getOwnerOnlyStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const admin = createAdminClient();
  if (!admin.supabase) return { error: admin.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "STAFF");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El email no es válido." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La contraseña inicial debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  if (!(STAFF_ROLES as readonly string[]).includes(role)) {
    return { error: "Rol no válido." };
  }

  const { data: created, error: userError } = await admin.supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !created.user) {
    const alreadyExists = userError?.message.toLowerCase().includes("already");
    return {
      error: alreadyExists
        ? "Ese email ya tiene una cuenta en la plataforma. Usa otro email para el empleado o contacta a soporte."
        : `No se pudo crear la cuenta: ${userError?.message ?? "error desconocido"}`,
    };
  }

  const { error: insertError } = await admin.supabase.from("store_staff").insert({
    store_id: ctx.storeId,
    user_id: created.user.id,
    email,
    role,
  });

  if (insertError) {
    // Rollback: una cuenta sin tienda asignada no sirve.
    await admin.supabase.auth.admin.deleteUser(created.user.id);
    return { error: `No se pudo asignar el empleado: ${insertError.message}` };
  }

  revalidatePath("/admin/staff");
  return { error: null };
}

// Quita al empleado de la tienda. Si su cuenta no tiene ningún otro uso
// (no es dueño, ni empleado de otra tienda, ni SuperAdmin) se elimina, para
// no dejar cuentas huérfanas que puedan iniciar sesión.
export async function removeStaff(staffId: string): Promise<ActionResult> {
  const ctx = await getOwnerOnlyStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const admin = createAdminClient();
  if (!admin.supabase) return { error: admin.error };

  const { data: removed, error } = await admin.supabase
    .from("store_staff")
    .delete()
    .eq("id", staffId)
    .eq("store_id", ctx.storeId)
    .select("user_id")
    .returns<{ user_id: string }[]>();

  if (error || !removed?.length) {
    return { error: "No se pudo quitar al empleado." };
  }

  const userId = removed[0].user_id;
  const [ownedStores, otherAssignments, profile] = await Promise.all([
    admin.supabase.from("stores").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    admin.supabase
      .from("store_staff")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin.supabase
      .from("profiles")
      .select("global_role")
      .eq("id", userId)
      .maybeSingle<{ global_role: string | null }>(),
  ]);

  const isUnused =
    !ownedStores.error &&
    !otherAssignments.error &&
    (ownedStores.count ?? 0) === 0 &&
    (otherAssignments.count ?? 0) === 0 &&
    profile.data?.global_role !== SUPERADMIN_ROLE;

  if (isUnused) {
    await admin.supabase.auth.admin.deleteUser(userId);
  }

  revalidatePath("/admin/staff");
  return { error: null };
}
