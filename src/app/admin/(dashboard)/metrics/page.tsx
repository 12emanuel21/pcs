import { Suspense } from "react";
import { MessageCircle, TrendingUp } from "lucide-react";
import NoStoreNotice from "@/components/admin/NoStoreNotice";
import PageSkeleton from "@/components/admin/PageSkeleton";
import SalesChart from "@/components/admin/SalesChart";
import StatCard from "@/components/admin/StatCard";
import { getCurrentStore } from "@/lib/auth";
import { getSalesDataForChart } from "@/lib/chart-utils";
import { formatCOP } from "@/lib/format";
import type { OrderLog } from "@/types";

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StoreMetrics />
    </Suspense>
  );
}

// Métricas de la tienda (antes arriba de Productos en /admin). Mismo acceso
// que el panel: dueño y empleados de la tienda (getCurrentStore).
async function StoreMetrics() {
  const { supabase, store } = await getCurrentStore();

  if (!store) return <NoStoreNotice />;

  // Suma en JS: suficiente para el MVP. Con mucho volumen conviene una
  // función SQL (RPC) que devuelva count y sum directamente.
  const {
    data: orderLogs,
    count: ordersCount,
    error: ordersError,
  } = await supabase
    .from("order_logs")
    .select("total, status, created_at", { count: "exact" })
    .eq("store_id", store.id)
    .returns<Pick<OrderLog, "total" | "status" | "created_at">[]>();

  const salesChartData = getSalesDataForChart(orderLogs ?? []);

  const intentVolume = (orderLogs ?? []).reduce(
    (sum, log) => sum + Number(log.total),
    0,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Métricas</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Resumen de Actividad
        </h2>
        {ordersError ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            No se pudo cargar la actividad de pedidos.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={<MessageCircle size={20} />}
              label="Pedidos generados"
              value={String(ordersCount ?? 0)}
              hint="Clics en «Comprar por WhatsApp»"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Volumen de intención"
              value={formatCOP(intentVolume)}
              hint="Suma de los pedidos enviados a WhatsApp"
            />
          </div>
        )}
        {!ordersError && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Intención de compra (Últimos 7 días)
            </h3>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              Total de los pedidos enviados a WhatsApp por día, sin los cancelados.
            </p>
            <SalesChart data={salesChartData} />
          </div>
        )}
      </section>
    </div>
  );
}
