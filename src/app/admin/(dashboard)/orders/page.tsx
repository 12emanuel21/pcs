import { Suspense } from "react";
import { CheckCircle2, Clock, Inbox, Store as StoreIcon } from "lucide-react";
import OrderRow from "@/components/admin/OrderRow";
import PageSkeleton from "@/components/admin/PageSkeleton";
import StatCard from "@/components/admin/StatCard";
import { getCurrentStore } from "@/lib/auth";
import { formatCOP } from "@/lib/format";
import type { OrderLog } from "@/types";

// Supabase devuelve máx. 1000 filas por consulta; se muestran los más
// recientes. Para historiales largos hará falta paginar.
const MAX_ORDERS = 500;

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersInbox />
    </Suspense>
  );
}

async function OrdersInbox() {
  const { supabase, store } = await getCurrentStore();

  if (!store) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <StoreIcon className="mx-auto text-zinc-400 dark:text-zinc-500" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Aún no tienes una tienda asignada
        </h1>
      </div>
    );
  }

  const { data: orders, error } = await supabase
    .from("order_logs")
    .select("id, store_id, total, items, status, customer_name, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS)
    .returns<OrderLog[]>();

  if (error) throw error;

  const pending = orders.filter((order) => (order.status ?? "PENDING") === "PENDING");
  const paid = orders.filter((order) => order.status === "PAID");
  const paidTotal = paid.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Pedidos</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Cada vez que un cliente toca &quot;Comprar por WhatsApp&quot; queda un
        pedido aquí. Márcalo como pagado cuando recibas el dinero y envíale su
        recibo.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Clock size={20} />}
          label="Pendientes"
          value={String(pending.length)}
          hint="Pedidos por confirmar o cobrar"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Ventas pagadas"
          value={formatCOP(paidTotal)}
          hint={`${paid.length} ${paid.length === 1 ? "pedido pagado" : "pedidos pagados"}`}
        />
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center text-zinc-500 dark:text-zinc-400">
          <Inbox size={36} />
          Aún no tienes pedidos. Comparte el enlace de tu tienda para empezar a
          recibirlos.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} storeName={store.name} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {orders.length === MAX_ORDERS && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Mostrando los {MAX_ORDERS} pedidos más recientes.
        </p>
      )}
    </div>
  );
}
