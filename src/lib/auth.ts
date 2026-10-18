import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { SUPERADMIN_ROLE, type Profile, type Store } from "@/types";

// Cookie del "Modo Soporte": id de la tienda que el SuperAdmin administra.
// Solo se respeta si el usuario actual es SUPERADMIN (se verifica siempre).
export const IMPERSONATE_COOKIE = "impersonate_store_id";

// Devuelve el usuario autenticado o redirige al login. Debe llamarse dentro
// de un <Suspense>, porque lee cookies (requisito de cacheComponents).
export async function requireUser() {
  // Supabase usa Date.now() para validar la expiración del token. Con
  // partialPrefetching, Next prerenderiza esta ruta con cookies disponibles y
  // marca Date.now() como error; connection() fuerza el render por request.
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/admin/login");

  return { supabase, user: data.user };
}

async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, global_role")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) throw error;
  return data;
}

async function fetchOwnStore(
  supabase: SupabaseClient,
  userId: string,
): Promise<Store | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle<Store>();

  if (error) throw error;
  return data;
}

// Si hay cookie de Modo Soporte y el usuario es SUPERADMIN, devuelve la tienda
// impersonada y el cliente admin (salta RLS; las consultas siempre filtran por
// store_id). Devuelve null si no aplica.
async function resolveImpersonation(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ supabase: SupabaseClient; store: Store } | null> {
  const storeId = (await cookies()).get(IMPERSONATE_COOKIE)?.value;
  if (!storeId) return null;

  const profile = await fetchProfile(supabase, userId);
  if (profile?.global_role !== SUPERADMIN_ROLE) return null;

  const admin = createAdminClient();
  if (!admin.supabase) return null;

  const { data: store } = await admin.supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle<Store>();

  return store ? { supabase: admin.supabase, store } : null;
}

// Tienda que se está administrando en /admin: la impersonada (Modo Soporte)
// o la propia. cache() deduplica entre layout y página en el mismo request.
// Empleado: tienda asignada en store_staff. Los datos se operan con el
// cliente admin (las políticas RLS de productos/pedidos son solo del dueño);
// todas las consultas filtran por el store_id de la asignación.
async function resolveStaffStore(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ supabase: SupabaseClient; store: Store } | null> {
  const { data: assignment } = await supabase
    .from("store_staff")
    .select("store_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle<{ store_id: string }>();
  if (!assignment) return null;

  const admin = createAdminClient();
  if (!admin.supabase) {
    console.error(`Empleado ${userId} sin acceso: ${admin.error}`);
    return null;
  }

  const { data: store } = await admin.supabase
    .from("stores")
    .select("*")
    .eq("id", assignment.store_id)
    .maybeSingle<Store>();

  return store ? { supabase: admin.supabase, store } : null;
}

export type AccessLevel = "OWNER" | "STAFF";

type StoreAccess =
  | {
      supabase: SupabaseClient;
      store: Store;
      accessLevel: AccessLevel;
      isImpersonating: boolean;
    }
  | {
      supabase: SupabaseClient;
      store: null;
      accessLevel: null;
      isImpersonating: false;
    };

// Prioridad: Modo Soporte (SUPERADMIN, cuenta como OWNER) > tienda propia >
// tienda donde es empleado.
async function resolveStoreAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoreAccess> {
  const impersonated = await resolveImpersonation(supabase, userId);
  if (impersonated) {
    return { ...impersonated, accessLevel: "OWNER", isImpersonating: true };
  }

  const ownStore = await fetchOwnStore(supabase, userId);
  if (ownStore) {
    return { supabase, store: ownStore, accessLevel: "OWNER", isImpersonating: false };
  }

  const staff = await resolveStaffStore(supabase, userId);
  if (staff) {
    return { ...staff, accessLevel: "STAFF", isImpersonating: false };
  }

  return { supabase, store: null, accessLevel: null, isImpersonating: false };
}

// Tienda que se está administrando en /admin: la impersonada (Modo Soporte),
// la propia o aquella donde el usuario es empleado. accessLevel indica los
// permisos de la sesión. cache() deduplica entre layout y página.
export const getCurrentStore = cache(async () => {
  const { supabase, user } = await requireUser();
  const access = await resolveStoreAccess(supabase, user.id);
  return { ...access, user };
});

// Para páginas solo del dueño: sin tienda o siendo STAFF redirige a /admin.
export async function requireOwnerAccess() {
  const current = await getCurrentStore();
  if (!current.store || current.accessLevel !== "OWNER") redirect("/admin");
  return current;
}

// Tienda propia del usuario, ignorando el Modo Soporte.
export const getOwnStore = cache(async () => {
  const { supabase, user } = await requireUser();
  return fetchOwnStore(supabase, user.id);
});

// Variante para Server Actions: devuelve un error en vez de redirigir. El
// store nunca viene del cliente: se deriva de la sesión (tienda propia,
// asignación de empleado o Modo Soporte) para que nadie pueda tocar otra.
export async function getOwnerStore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const access = await resolveStoreAccess(supabase, user.id);
  if (!access.store) return { error: "No tienes una tienda asignada." };

  return {
    supabase: access.supabase,
    store: access.store,
    storeId: access.store.id,
    accessLevel: access.accessLevel,
    userId: user.id,
  };
}

// Igual que getOwnerStore, pero solo para el dueño (o SuperAdmin en Modo
// Soporte). Los empleados reciben un error.
export async function getOwnerOnlyStore() {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return ctx;
  if (ctx.accessLevel !== "OWNER") {
    return { error: "Solo el dueño de la tienda puede hacer esto." };
  }
  return ctx;
}

// Perfil (con global_role) del usuario autenticado, o null si no hay sesión
// o no tiene fila en profiles. Debe llamarse dentro de un <Suspense>.
export const getUserProfile = cache(async (): Promise<Profile | null> => {
  // Ver requireUser: evita el error de Date.now() en el prerender.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return fetchProfile(supabase, user.id);
});

// Sin rol SUPERADMIN -> /admin. No se usa /admin/login: con sesión activa el
// proxy lo devolvería a /admin, y sin sesión el proxy ya redirige al login
// antes de llegar aquí (y /admin también lo haría).
export async function requireSuperAdmin() {
  const profile = await getUserProfile();

  if (profile?.global_role !== SUPERADMIN_ROLE) redirect("/admin");

  const supabase = await createClient();
  return { supabase, profile };
}

// Variante para Server Actions del SuperAdmin: verifica el rol sin redirigir
// y entrega el cliente admin (service role).
export async function getSuperAdminActionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const profile = await fetchProfile(supabase, user.id);
  if (profile?.global_role !== SUPERADMIN_ROLE) {
    return { error: "No tienes permisos de SuperAdmin." };
  }

  const admin = createAdminClient();
  if (!admin.supabase) return { error: admin.error };

  return { admin: admin.supabase, profile };
}
