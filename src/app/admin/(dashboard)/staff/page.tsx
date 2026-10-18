import { Suspense } from "react";
import { Users } from "lucide-react";
import InviteStaffForm from "@/components/admin/InviteStaffForm";
import PageSkeleton from "@/components/admin/PageSkeleton";
import RemoveStaffButton from "@/components/admin/RemoveStaffButton";
import ServiceRoleNotice from "@/components/superadmin/ServiceRoleNotice";
import { requireOwnerAccess } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

interface StaffRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StaffContent />
    </Suspense>
  );
}

async function StaffContent() {
  // Solo el dueño (o SuperAdmin en Modo Soporte); un empleado va a /admin.
  const { store } = await requireOwnerAccess();

  const admin = createAdminClient();
  if (!admin.supabase) return <ServiceRoleNotice message={admin.error} />;

  const { data: staff, error } = await admin.supabase
    .from("store_staff")
    .select("id, email, role, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: true })
    .returns<StaffRow[]>();

  if (error) throw error;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Empleados</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Da acceso al panel a tus vendedores sin compartir tu contraseña.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <InviteStaffForm />

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Equipo{" "}
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">({staff.length})</span>
          </h2>
          {staff.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <Users size={28} />
              Aún no tienes empleados.
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Desde</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {member.role === "STAFF" ? "Vendedor" : member.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {dateFormatter.format(new Date(member.created_at))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RemoveStaffButton staffId={member.id} email={member.email} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
