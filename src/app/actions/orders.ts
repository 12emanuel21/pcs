"use server";

import { isStoreActive } from "@/lib/store-utils";
import { createClient } from "@/utils/supabase/server";
import type { Store } from "@/types";

export interface OrderLogItem {
  id: string;
  quantity: number;
}

const MAX_ITEMS = 100;
const MAX_QUANTITY = 999;

// Registra la intención de compra antes de abrir WhatsApp. El comprador es
// anónimo, así que no se confía en precios ni total enviados por el
// navegador: se recalculan con los productos activos de la tienda.
export async function logOrder(
  storeId: string,
  items: OrderLogItem[],
  total: number,
): Promise<{ success: boolean }> {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return { success: false };
  }

  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = Math.floor(Number(item?.quantity));
    if (typeof item?.id !== "string" || !(quantity >= 1 && quantity <= MAX_QUANTITY)) {
      return { success: false };
    }
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + quantity);
  }

  const supabase = await createClient();

  // Tiendas suspendidas o vencidas no registran pedidos (su catálogo no está
  // disponible).
  const { data: store } = await supabase
    .from("stores")
    .select("is_active, subscription_end")
    .eq("id", storeId)
    .maybeSingle<Pick<Store, "is_active" | "subscription_end">>();
  if (!store || !isStoreActive(store)) return { success: false };

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .in("id", [...quantities.keys()])
    .returns<{ id: string; name: string; price: number }[]>();

  if (productsError || !products?.length) return { success: false };

  const lines = products.map((product) => {
    const quantity = quantities.get(product.id) ?? 0;
    return {
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity,
    };
  });
  const verifiedTotal = lines.reduce((sum, line) => sum + line.subtotal, 0);

  if (verifiedTotal !== total) {
    // Precios desactualizados en el carrito del cliente: se registra el total
    // real, que es lo que verá el dueño en su panel.
    console.warn(
      `logOrder: total del cliente (${total}) difiere del real (${verifiedTotal}) en la tienda ${storeId}`,
    );
  }

  const { error } = await supabase.from("order_logs").insert({
    store_id: storeId,
    items: lines,
    total: verifiedTotal,
  });

  if (error) {
    console.error("logOrder: no se pudo registrar el pedido", error.message);
    return { success: false };
  }

  return { success: true };
}
