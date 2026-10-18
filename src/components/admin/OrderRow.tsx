"use client";

import { useState, useTransition } from "react";
import { Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/admin/orders/actions";
import ReceiptModal from "@/components/admin/ReceiptModal";
import { formatCOP } from "@/lib/format";
import { formatOrderDate } from "@/lib/receipt";
import { ORDER_STATUSES, type OrderLog, type OrderStatus } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  PAID: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-900",
  CANCELLED: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-800",
};

interface OrderRowProps {
  order: OrderLog;
  storeName: string;
}

// Estado y cliente viven en la misma fila porque se guardan con la misma
// acción: así guardar el nombre nunca envía un estado desactualizado.
export default function OrderRow({ order, storeName }: OrderRowProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status ?? "PENDING");
  const [customerName, setCustomerName] = useState(order.customer_name ?? "");
  const [savedName, setSavedName] = useState(order.customer_name ?? "");
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const summary = order.items
    .map((item) => `${item.quantity}× ${item.name}`)
    .join(", ");

  const handleStatusChange = (next: OrderStatus) => {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, next);
      if (result.error) {
        setStatus(previous);
        toast.error(result.error);
      }
    });
  };

  const saveCustomerName = () => {
    const name = customerName.trim();
    if (name === savedName) return;
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status, name);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSavedName(name);
      setCustomerName(name);
      toast.success("Cliente guardado.");
    });
  };

  return (
    <tr className={status === "CANCELLED" ? "opacity-60" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
        {formatOrderDate(order.created_at)}
      </td>
      <td className="max-w-xs px-4 py-3">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {units} {units === 1 ? "unidad" : "unidades"}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={summary}>
          {summary}
        </p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
        {formatCOP(Number(order.total))}
      </td>
      <td className="px-4 py-3">
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onBlur={saveCustomerName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setCustomerName(savedName);
              e.currentTarget.blur();
            }
          }}
          maxLength={100}
          placeholder="Consumidor Final"
          aria-label="Nombre del cliente"
          className="w-40 rounded-md border border-transparent bg-transparent px-2 py-1 text-zinc-900 outline-none placeholder:text-zinc-400 hover:border-zinc-200 focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:hover:border-zinc-700"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            disabled={isPending}
            aria-label="Estado del pedido"
            className={`cursor-pointer appearance-none rounded-full border px-3 py-1 text-xs font-semibold outline-none disabled:cursor-wait ${STATUS_STYLES[status]}`}
          >
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          {isPending && <Loader2 size={14} className="animate-spin text-zinc-400 dark:text-zinc-500" />}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => setShowReceipt(true)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ReceiptText size={14} />
          Generar Recibo
        </button>
        {showReceipt && (
          <ReceiptModal
            storeName={storeName}
            order={{ ...order, status }}
            customerName={customerName}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </td>
    </tr>
  );
}
