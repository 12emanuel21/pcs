import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types";

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  increaseItem: (storeId: string, productId: string) => void;
  decreaseItem: (storeId: string, productId: string) => void;
  clearCart: (storeId?: string) => void;
  getTotal: (storeId?: string) => number;
}

// true si ya no se pueden agregar más unidades (stock null = ilimitado).
// El stock es el que tenía el producto al agregarlo/actualizarlo en el carrito.
export function hasReachedStock(item: Pick<CartItem, "quantity" | "stock">): boolean {
  return item.stock !== null && item.stock !== undefined && item.quantity >= item.stock;
}

// localStorage es compartido por todas las tiendas (mismo dominio), así que
// clearCart y getTotal aceptan un storeId opcional para limitarse a una tienda.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          if (existing) {
            // Se refrescan los datos del producto (stock, precio) con los
            // actuales de la vitrina.
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, ...product, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      increaseItem: (storeId, productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId &&
            item.store_id === storeId &&
            !hasReachedStock(item)
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        })),
      decreaseItem: (storeId, productId) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.id !== productId || item.store_id !== storeId) return [item];
            // Al llegar a 0 se elimina del carrito.
            return item.quantity <= 1
              ? []
              : [{ ...item, quantity: item.quantity - 1 }];
          }),
        })),
      clearCart: (storeId) =>
        set((state) => ({
          items: storeId
            ? state.items.filter((item) => item.store_id !== storeId)
            : [],
        })),
      getTotal: (storeId) =>
        calculateTotal(
          get().items.filter((item) => !storeId || item.store_id === storeId),
        ),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Se rehidrata manualmente en el cliente (ver Cart.tsx) para evitar
      // diferencias de hidratación entre el HTML del servidor y localStorage.
      skipHydration: true,
    },
  ),
);

export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
