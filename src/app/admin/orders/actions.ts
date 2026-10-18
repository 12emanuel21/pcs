"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOwnerStore } from "@/lib/auth";
import { ORDER_STATUSES, type OrderItem, type OrderStatus } from "@/types";

export interface ActionResult {
  error: string | null;
}

const MAX_CUSTOMER_NAME = 100;
const STOCK_RETRIES = 3;

// Suma (delta > 0) o resta (delta < 0) unidades al stock de un producto de la
// tienda, sin bajar de 0. Productos con stock null (ilimitado) o borrados se
// ignoran. Escritura condicional (eq stock = valor leído) con reintentos para
// no perder cambios si dos pedidos se pagan al mismo tiempo.
async function adjustStock(
  supabase: SupabaseClient,
  storeId: string,
  productId: string,
  delta: number,
) {
  for (let attempt = 0; attempt < STOCK_RETRIES; attempt++) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .eq("store_id", storeId)
      .maybeSingle<{ stock: number | null }>();

    if (!product || product.stock === null || product.stock === undefined) return;

    const { data } = await supabase
      .from("products")
      .update({ stock: Math.max(product.stock + delta, 0) })
      .eq("id", productId)
      .eq("store_id", storeId)
      .eq("stock", product.stock)
      .select("id");

    if (data?.length) return;
  }
  console.error(`adjustStock: no se pudo ajustar el stock de ${productId}`);
}

// Aplica el movimiento de stock de un pedido: -1 descuenta, +1 devuelve.
async function applyOrderStock(
  supabase: SupabaseClient,
  storeId: string,
  items: OrderItem[],
  direction: 1 | -1,
) {
  const quantities = new Map<string, number>();
  for (const item of items ?? []) {
    if (!item?.product_id) continue;
    quantities.set(
      item.product_id,
      (quantities.get(item.product_id) ?? 0) + Number(item.quantity || 0),
    );
  }

  await Promise.all(
    [...quantities].map(([productId, quantity]) =>
      adjustStock(supabase, storeId, productId, direction * quantity),
    ),
  );
}

// customerName: undefined = no tocarlo; "" = borrarlo; texto = guardarlo.
//
// Stock: al pasar a PAID se descuentan las unidades vendidas; al salir de PAID
// (pagado por error, cancelado) se devuelven. Así marcar/desmarcar varias
// veces no descuenta dos veces.
export async function updateOrderStatus(
  orderId: string,
  status: string,
  customerName?: string,
): Promise<ActionResult> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { error: "Estado de pedido no válido." };
  }

  const changes: { status: string; customer_name?: string | null } = { status };
  if (customerName !== undefined) {
    const name = customerName.trim().replace(/\s+/g, " ");
    if (name.length > MAX_CUSTOMER_NAME) {
      return {
        error: `El nombre del cliente no puede superar ${MAX_CUSTOMER_NAME} caracteres.`,
      };
    }
    changes.customer_name = name || null;
  }

  // El filtro por store_id garantiza que el pedido sea de esta tienda.
  const { data: current } = await ctx.supabase
    .from("order_logs")
    .select("status, items")
    .eq("id", orderId)
    .eq("store_id", ctx.storeId)
    .maybeSingle<{ status: OrderStatus | null; items: OrderItem[] }>();

  if (!current) return { error: "El pedido no existe o no es de tu tienda." };

  const previousStatus = current.status ?? "PENDING";

  // Escritura condicional sobre el estado leído: si otra pestaña cambió el
  // pedido entretanto, no se aplica (y el stock no se mueve dos veces).
  const { data, error } = await ctx.supabase
    .from("order_logs")
    .update(changes)
    .eq("id", orderId)
    .eq("store_id", ctx.storeId)
    .eq("status", previousStatus)
    .select("id");

  // RLS puede bloquear el update sin devolver error: se valida que afectó 1 fila.
  if (error || !data?.length) {
    return {
      error: "No se pudo actualizar el pedido. Recarga la página e intenta de nuevo.",
    };
  }

  if (status === "PAID" && previousStatus !== "PAID") {
    await applyOrderStock(ctx.supabase, ctx.storeId, current.items, -1);
  } else if (previousStatus === "PAID" && status !== "PAID") {
    await applyOrderStock(ctx.supabase, ctx.storeId, current.items, 1);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/${ctx.storeId}`);
  return { error: null };
}
