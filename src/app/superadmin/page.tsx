import { Suspense } from "react";
import { ExternalLink, Wrench } from "lucide-react";
import PageSkeleton from "@/components/admin/PageSkeleton";
import StatusToggle from "@/components/admin/StatusToggle";
import CreateStoreModal from "@/components/superadmin/CreateStoreModal";
import RenewSubscriptionButton from "@/components/superadmin/RenewSubscriptionButton";
import ServiceRoleNotice from "@/components/superadmin/ServiceRoleNotice";
import SubscriptionDateEditor from "@/components/superadmin/SubscriptionDateEditor";
import { startImpersonation, toggleStoreStatus } from "@/app/superadmin/actions";
import { requireSuperAdmin } from "@/lib/auth";
import {
  formatSubscriptionDate,
  getDaysUntilExpiration,
  getSubscriptionEndDate,
} from "@/lib/store-utils";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Store } from "@/types";

type StoreRow = Pick<
  Store,
  "id" | "name" | "whatsapp_number" | "is_active" | "subscription_end"
>;

// Días que se consideran "por vencer" (aviso amarillo).
const EXPIRING_SOON_DAYS = 5;

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StoresOperations />
    </Suspense>
  );
}

// Vista operativa: a quién cobrarle y cómo actuar. Las métricas de ventas
// viven en /superadmin/metrics.
async function StoresOperations() {
  await requireSuperAdmin();

  // Lectura global con service role (después de verificar el rol).
  const db = createAdminClient();
  if (!db.supabase) return <ServiceRoleNotice message={db.error} />;

  const { data, error } = await db.supabase
    .from("stores")
    .select("id, name, whatsapp_number, is_active, subscription_end")
    .returns<StoreRow[]>();

  if (error) throw error;

  // Primero lo que hay que cobrar: menos días para el vencimiento arriba
  // (las vencidas tienen días negativos); las ilimitadas al final. Empates
  // por nombre.
  const now = new Date();
  const rows = data
    .map((store) => ({ store, days: getDaysUntilExpiration(store, now) }))
    .sort(
      (a, b) =>
        (a.days ?? Infinity) - (b.days ?? Infinity) ||
        a.store.name.localeCompare(b.store.name, "es"),
    );

  const expired = rows.filter(({ days }) => days !== null && days < 0).length;
  const expiringSoon = rows.filter(
    ({ days }) => days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS,
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tiendas y Clientes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {rows.length} {rows.length === 1 ? "tienda" : "tiendas"}
            {expired > 0 && (
              <>
                {" · "}
                <span className="font-medium text-red-600 dark:text-red-400">
                  {expired} {expired === 1 ? "vencida" : "vencidas"}
                </span>
              </>
            )}
            {expiringSoon > 0 && (
              <>
                {" · "}
                <span className="font-medium text-yellow-700 dark:text-yellow-400">
                  {expiringSoon} por vencer
                </span>
              </>
            )}
          </p>
        </div>
        <CreateStoreModal />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Tienda</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Vencimiento</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Aún no hay tiendas registradas.
                </td>
              </tr>
            ) : (
              rows.map(({ store, days }) => {
                const isActive = store.is_active !== false;
                return (
                  <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{store.name}</p>
                      <p className="font-mono text-xs text-slate-400 dark:text-slate-500">/{store.id}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                      {store.whatsapp_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <SubscriptionCell store={store} days={days} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusToggle
                        isActive={isActive}
                        action={toggleStoreStatus.bind(null, store.id, isActive)}
                        activeLabel="Activa"
                        inactiveLabel="Suspendida"
                        activeTitle="Suspender tienda (pago vencido)"
                        inactiveTitle="Reactivar tienda"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <form action={startImpersonation.bind(null, store.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/60"
                          >
                            <Wrench size={14} />
                            Administrar
                          </button>
                        </form>
                        <a
                          href={`/${store.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Ver tienda
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fecha de vencimiento con su aviso, la renovación rápida (+31 días) y el
// editor de fecha del SuperAdmin.
function SubscriptionCell({ store, days }: { store: StoreRow; days: number | null }) {
  const endDate = getSubscriptionEndDate(store);

  let badge: { text: string; className: string } | null = null;
  if (days !== null && days < 0) {
    badge = { text: "Vencida", className: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" };
  } else if (days !== null && days <= EXPIRING_SOON_DAYS) {
    badge = {
      text: days === 0 ? "Vence hoy" : `Vence en ${days} d`,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
    };
  }

  return (
    <div className="flex items-center gap-2">
      <span className={endDate ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
        {endDate ? formatSubscriptionDate(endDate) : "Ilimitado"}
      </span>
      {badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.text}
        </span>
      )}
      <RenewSubscriptionButton storeId={store.id} storeName={store.name} />
      <SubscriptionDateEditor
        storeId={store.id}
        storeName={store.name}
        currentDate={endDate}
      />
    </div>
  );
}
