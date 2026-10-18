import { formatCOP } from "@/lib/format";
import type { CartItem } from "@/store/cartStore";
import type { Store } from "@/types";

export function generateWhatsAppLink(
  store: Store,
  items: CartItem[],
  total: number,
): string {
  const lines = items.map(
    (item) =>
      `${item.quantity}x ${item.name} - ${formatCOP(item.price * item.quantity)}`,
  );

  const mensaje = [
    `¡Hola! Quiero hacer este pedido en ${store.name}:`,
    "",
    ...lines,
    "",
    `Total: ${formatCOP(total)}`,
  ].join("\n");

  // wa.me solo acepta dígitos (sin "+", espacios ni guiones).
  const phone = store.whatsapp_number.replace(/\D/g, "");

  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
}

const DEFAULT_COUNTRY_CODE = "57"; // Colombia

// Normaliza a formato internacional solo con dígitos (ej: 573001234567).
// Acepta "+57 300-123 4567", "0057 3001234567" o un celular local "3001234567".
export function normalizeWhatsApp(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Celular colombiano sin indicativo: 10 dígitos que empiezan por 3.
  if (digits.length === 10 && digits.startsWith("3")) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  // E.164 permite hasta 15 dígitos; menos de 11 no incluye indicativo.
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}
