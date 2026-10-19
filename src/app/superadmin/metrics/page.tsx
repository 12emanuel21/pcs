import { Suspense } from "react";
import { CircleCheck, LifeBuoy, MessageCircle, Store as StoreIcon, TrendingUp } from "lucide-react";
import PageSkeleton from "@/components/admin/PageSkeleton";
import SalesChart from "@/components/admin/SalesChart";
import StatCard from "@/components/admin/StatCard";
import ServiceRoleNotice from "@/components/superadmin/ServiceRoleNotice";
import { requireSuperAdmin } from "@/lib/auth";
import { getSalesDataForChart } from "@/lib/chart-utils";
import { formatCOP } from "@/lib/format";
import { isStoreActive } from "@/lib/store-utils";
import { createAdminClient } from "@/utils/supabase/admin";
import type { OrderLog, Store } from "@/types";

type StoreRow = Pick<Store, "id" | "name" | "is_active" | "subscription_end">;
type LogRow = Pick<OrderLog, "store_id" | "total" | "status" | "created_at">;

interface StoreStats {
  pending: number;
  paid: number;
  // Todos los pedidos enviados a WhatsApp (incluye cancelados), igual que
  // "Volumen de intención" en el panel de cada tienda.
  intentTotal: number;
  paidTotal: number;
}

const emptyStats = (): StoreStats => ({ pending: 0, paid: 0, intentTotal: 0, paidTotal: 0 });

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GlobalMetrics />
    </Suspense>
  );
}

async function GlobalMetrics() {
  await requireSuperAdmin();

  // Lecturas globales con service role (después de verificar el rol).
  const db = createAdminClient();
  if (!db.supabase) return <ServiceRoleNotice message={db.error} />;

  const [storesResult, logsResult, ticketsResult] = await Promise.all([
    db.supabase
      .from("stores")
      .select("id, name, is_active, subscription_end")
      .returns<StoreRow[]>(),
    // Suma en JS: suficiente para el MVP. Supabase devuelve máx. 1000 filas
    // por consulta; con más volumen hay que agregar en SQL (RPC).
    db.supabase
      .from("order_logs")
      .select("store_id, total, status, created_at")
      .returns<LogRow[]>(),
    db.supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .neq("status", "RESOLVED"),
  ]);

  if (storesResult.error) throw storesResult.error;
  if (logsResult.error) throw logsResult.error;

  const stores = storesResult.data;
  const logs = logsResult.data;

  const statsByStore = new Map<string, StoreStats>();
  const global = emptyStats();
  for (const log of logs) {
    const total = Number(log.total);
    const stats = statsByStore.get(log.store_id) ?? emptyStats();
    for (const target of [stats, global]) {
      target.intentTotal += total;
      if (log.status === "PENDING") target.pending += 1;
      if (log.status === "PAID") {
        target.paid += 1;
        target.paidTotal += total;
      }
    }
    statsByStore.set(log.store_id, stats);
  }

  const activeStores = stores.filter((store) => isStoreActive(store)).length;

  // Mayor intención primero; empates por nombre.
  const rows = stores
    .map((store) => ({ store, stats: statsByStore.get(store.id) ?? emptyStats() }))
    .sort(
      (a, b) =>
        b.stats.intentTotal - a.stats.intentTotal ||
        a.store.name.localeCompare(b.store.name, "es"),
    );

  const cell = "px-4 py-3 text-right tabular-nums";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Métricas y Ventas</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<StoreIcon size={20} />}
          label="Tiendas registradas"
          value={String(stores.length)}
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
          value={formatCOP(global.intentTotal)}
          hint="Suma de todos los pedidos enviados a WhatsApp"
        />
        <StatCard
          icon={<CircleCheck size={20} />}
          label="Total pagado global"
          value={formatCOP(global.paidTotal)}
          hint="Pedidos marcados como pagados por las tiendas"
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Rendimiento por tienda
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          La intención incluye todos los pedidos enviados a WhatsApp (también
          los cancelados); el total pagado, solo los marcados como pagados.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Tienda</th>
                <th className="px-4 py-3 text-right">Pedidos pendientes</th>
                <th className="px-4 py-3 text-right">Pedidos pagados</th>
                <th className="px-4 py-3 text-right">Total intención</th>
                <th className="px-4 py-3 text-right">Total pagado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aún no hay tiendas registradas.
                  </td>
                </tr>
              ) : (
                rows.map(({ store, stats }) => (
                  <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{store.name}</p>
                      <p className="font-mono text-xs text-slate-400 dark:text-slate-500">/{store.id}</p>
                    </td>
                    <td className={cell}>{stats.pending}</td>
                    <td className={cell}>{stats.paid}</td>
                    <td className={cell}>{formatCOP(stats.intentTotal)}</td>
                    <td className={cell}>{formatCOP(stats.paidTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total de todos los pedidos (incluye los de tiendas que ya no
                existen, si los hubiera): coincide con las tarjetas. */}
            <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <tr>
                <th scope="row" className="px-4 py-3 text-left">
                  TOTAL GLOBAL
                </th>
                <td className={cell}>{global.pending}</td>
                <td className={cell}>{global.paid}</td>
                <td className={cell}>{formatCOP(global.intentTotal)}</td>
                <td className={cell}>{formatCOP(global.paidTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
