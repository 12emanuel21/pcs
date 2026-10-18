import { formatCOP } from "@/lib/format";
import type { OrderLog } from "@/types";

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export function formatOrderDate(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

// Recibo en texto plano con el formato de WhatsApp (*negrita*).
export function buildReceiptText(
  storeName: string,
  order: Pick<OrderLog, "created_at" | "customer_name" | "items" | "total">,
): string {
  const lines = order.items.map(
    (item) =>
      `${item.quantity}x ${item.name} - ${formatCOP(item.subtotal ?? item.price * item.quantity)}`,
  );

  return [
    `🧾 *RECIBO DE PAGO* - ${storeName}`,
    `Fecha: ${formatOrderDate(order.created_at)}`,
    `Cliente: ${order.customer_name?.trim() || "Consumidor Final"}`,
    "",
    "*Detalle:*",
    ...lines,
    "",
    `*Total Pagado:* ${formatCOP(Number(order.total))}`,
    "¡Gracias por tu compra!",
  ].join("\n");
}
