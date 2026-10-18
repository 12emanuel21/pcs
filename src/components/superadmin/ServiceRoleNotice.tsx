import { KeyRound } from "lucide-react";

// Se muestra en el área SuperAdmin cuando falta SUPABASE_SERVICE_ROLE_KEY.
export default function ServiceRoleNotice({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex items-center gap-2 font-semibold">
        <KeyRound size={18} />
        Configuración pendiente
      </div>
      <p className="mt-2 text-sm">{message}</p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-amber-100 px-3 py-2 text-xs dark:bg-amber-950/60">
        SUPABASE_SERVICE_ROLE_KEY=tu_clave_secreta
      </pre>
    </div>
  );
}
