import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con service role: salta RLS. Solo debe usarse en el servidor y
// después de requireSuperAdmin() (o de verificar el rol SUPERADMIN).
// Nunca lo importes desde un componente "use client".
export function createAdminClient():
  | { supabase: SupabaseClient; error: null }
  | { supabase: null; error: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return {
      supabase: null,
      error:
        "Falta SUPABASE_SERVICE_ROLE_KEY. Cópiala de Supabase (Project Settings → API Keys → secret / service_role), agrégala a .env.local como SUPABASE_SERVICE_ROLE_KEY=... (sin el prefijo NEXT_PUBLIC_) y reinicia el servidor.",
    };
  }

  return {
    supabase: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    error: null,
  };
}
