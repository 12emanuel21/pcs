import { Suspense } from "react";
import {
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  Store as StoreIcon,
  TrendingUp,
  Wrench,
} from "lucide-react";
import PageSkeleton from "@/components/admin/PageSkeleton";
import SalesChart from "@/components/admin/SalesChart";
import StatCard from "@/components/admin/StatCard";
import StatusToggle from "@/components/admin/StatusToggle";
import CreateStoreModal from "@/components/superadmin/CreateStoreModal";
import ServiceRoleNotice from "@/components/superadmin/ServiceRoleNotice";
import SubscriptionDateEditor from "@/components/superadmin/SubscriptionDateEditor";
import { startImpersonation, toggleStoreStatus } from "@/app/superadmin/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getSalesDataForChart } from "@/lib/chart-utils";
import { formatCOP } from "@/lib/format";
import {
  formatSubscriptionDate,
  getDaysUntilExpiration,
  getSubscriptionEndDate,
  isStoreActive,
} from "@/lib/store-utils";
import { createAdminClient } from "@/utils/supabase/admin";
import type { OrderLog, Store } from "@/types";

type StoreRow = Pick<
  Store,
  | "id"
  | "name"
  | "whatsapp_number"
  | "created_at"
  | "is_active"
  | "subscription_end"
>;

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SuperAdminDashboard />
    </Suspense>
  );
}

async function SuperAdminDashboard() {
  await requireSuperAdmin();

  // Lecturas globales con service role (después de verificar el rol).
  const db = createAdminClient();
  if (!db.supabase) return <ServiceRoleNotice message={db.error} />;

  const [storesResult, logsResult, ticketsResult] = await Promise.all([
    db.supabase
      .from("stores")
      .select(
        "id, name, whatsapp_number, created_at, is_active, subscription_end",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .returns<StoreRow[]>(),
    // Suma en JS: suficiente para el MVP. Supabase devuelve máx. 1000 filas
    // por consulta; con más volumen hay que agregar en SQL (RPC).
    db.supabase
      .from("order_logs")
      .select("store_id, total, status, created_at")
      .returns<
        (Pick<OrderLog, "total" | "status" | "created_at"> & { store_id: string })[]
      >(),
    db.supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .neq("status", "RESOLVED"),
  ]);

  if (storesResult.error) throw storesResult.error;
  if (logsResult.error) throw logsResult.error;

  const stores = storesResult.data;
  const logs = logsResult.data;

  const statsByStore = new Map<string, { orders: number; volume: number }>();
  let globalVolume = 0;
  for (const log of logs) {
    const total = Number(log.total);
    globalVolume += total;
    const stats = statsByStore.get(log.store_id) ?? { orders: 0, volume: 0 };
    stats.orders += 1;
    stats.volume += total;
    statsByStore.set(log.store_id, stats);
  }

  const activeStores = stores.filter((store) => isStoreActive(store)).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tiendas y Clientes</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<StoreIcon size={20} />}
          label="Tiendas registradas"
          value={String(storesResult.count ?? stores.length)}
          hint={`${activeStores} activas · ${stores.length - activeStores} suspendidas o vencidas`}
        />
        <StatCard
          icon={<MessageCircle size={20} />}
          label="Pedidos generados"
          value={String(logs.length)}
          hint="Clics en «Comprar por WhatsApp» de todas las tiendas"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Volumen de intención global"
          value={formatCOP(globalVolume)}
          hint="Suma de todos los pedidos enviados a WhatsApp"
        />
        <StatCard
          icon={<LifeBuoy size={20} />}
          label="Tickets pendientes"
          value={ticketsResult.error ? "—" : String(ticketsResult.count ?? 0)}
          hint="Abiertos o en progreso"
        />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Intención de compra global (Últimos 7 días)
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Suma de todas las tiendas por día, sin los pedidos cancelados.
        </p>
        <SalesChart data={getSalesDataForChart(logs)} />
      </section>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tiendas</h2>
        <CreateStoreModal />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Tienda</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Creada</th>
              <th className="px-4 py-3 text-right">Pedidos</th>
              <th className="px-4 py-3 text-right">Volumen</th>
              <th className="px-4 py-3">Vencimiento</th>
              <th className="px-4 py-3">Estado (pago)</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Aún no hay tiendas registradas.
                </td>
              </tr>
            ) : (
              stores.map((store) => {
                const stats = statsByStore.get(store.id);
                const isActive = store.is_active !== false;
                return (
                  <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{store.name}</p>
                      <p className="font-mono text-xs text-slate-400 dark:text-slate-500">/{store.id}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                      {store.whatsapp_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                      {store.created_at
                        ? dateFormatter.format(new Date(store.created_at))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {stats?.orders ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {formatCOP(stats?.volume ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <SubscriptionCell store={store} />
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

// Fecha de vencimiento con aviso de estado y el editor del SuperAdmin.
function SubscriptionCell({ store }: { store: StoreRow }) {
  const endDate = getSubscriptionEndDate(store);
  const days = getDaysUntilExpiration(store);

  let badge: { text: string; className: string } | null = null;
  if (days !== null && days < 0) {
    badge = { text: "Vencida", className: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" };
  } else if (days !== null && days <= 5) {
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
      <SubscriptionDateEditor
        storeId={store.id}
        storeName={store.name}
        currentDate={endDate}
      />
    </div>
  );
}
