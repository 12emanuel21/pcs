"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { logOrder } from "@/app/actions/orders";
import ProductImage from "@/components/store/ProductImage";
import { formatCOP } from "@/lib/format";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import {
  calculateTotal,
  hasReachedStock,
  useCartStore,
} from "@/store/cartStore";
import type { Store } from "@/types";

interface CartProps {
  store: Store;
}

export default function Cart({ store }: CartProps) {
  const allItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  // Con el panel abierto: Escape lo cierra y la página de fondo no hace scroll.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // El carrito persistido es compartido entre tiendas: solo mostramos esta.
  const items = allItems.filter((item) => item.store_id === store.id);
  const total = calculateTotal(items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (items.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);

    // 1. Se lanza el registro primero para que la request salga ya.
    const logPromise = logOrder(
      store.id,
      items.map(({ id, quantity }) => ({ id, quantity })),
      total,
    ).catch(() => null);

    // 2. window.open debe ejecutarse antes de cualquier await: si no, el
    //    navegador (sobre todo Safari iOS) lo bloquea como pop-up.
    window.open(generateWhatsAppLink(store, items, total), "_blank");

    // 3. Se espera el registro con tope de tiempo; si falla no bloquea la venta.
    await Promise.race([
      logPromise,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    toast.success("¡Pedido generado!");
    clearCart(store.id);
    setIsCheckingOut(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón flotante: círculo compacto que no tapa las tarjetas; el total
          se ve dentro del carrito. Solo aparece con productos (siempre
          montado para animar la entrada; inert mientras está oculto) y el
          contador hace "pop" cada vez que cambia. El margen inferior suma el
          área segura del iPhone (barra de inicio). */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        inert={count === 0}
        aria-label={`Abrir carrito (${count} ${count === 1 ? "producto" : "productos"})`}
        className={`fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lg shadow-black/25 transition-all duration-200 hover:brightness-110 active:scale-95 motion-reduce:transition-none sm:right-[calc(1.5rem+env(safe-area-inset-right))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] ${
          count > 0 ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
        }`}
      >
        <ShoppingBag size={24} />
        {count > 0 && (
          <span
            key={count}
            className="animate-cart-pop absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold tabular-nums text-zinc-900 shadow ring-2 ring-brand"
          >
            {count}
          </span>
        )}
      </button>

      {/* Fondo: siempre montado para poder animar la opacidad. */}
      <div
        aria-hidden
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel lateral con slide-in. inert: cerrado no recibe foco ni clics. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        inert={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-l-3xl dark:bg-slate-900 ${
          // Sombra solo abierto: cerrado, fuera de pantalla, se asomaba como
          // una franja gris en el borde derecho.
          isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Tu pedido
            </h2>
            {count > 0 && (
              <p className="text-xs text-zinc-500 dark:text-slate-400">
                {count} {count === 1 ? "producto" : "productos"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-brand">
                <ShoppingBag size={36} />
              </div>
              <p className="text-zinc-500 dark:text-slate-400">
                Tu carrito está vacío. Agrega productos para hacer tu pedido.
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              >
                Ver productos
              </button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-slate-800">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-slate-800">
                    <ProductImage src={item.image_url} name={item.name} size="thumb" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-1">
                      <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-slate-100">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
                          {formatCOP(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs tabular-nums text-zinc-400 dark:text-slate-500">
                            {formatCOP(item.price)} c/u
                          </p>
                        )}
                      </div>
                      <QuantityControl
                        quantity={item.quantity}
                        name={item.name}
                        atLimit={hasReachedStock(item)}
                        onDecrease={() => decreaseItem(store.id, item.id)}
                        onIncrease={() => increaseItem(store.id, item.id)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-zinc-100 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-slate-400">
              Total
            </span>
            <span className="text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white">
              {formatCOP(total)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={items.length === 0 || isCheckingOut}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-base font-semibold text-[#0B3D1E] shadow-lg shadow-green-600/20 transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
          >
            {isCheckingOut ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <MessageCircle size={20} />
            )}
            {isCheckingOut ? "Generando pedido..." : "Comprar por WhatsApp"}
          </button>
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-slate-500">
            Se abrirá WhatsApp con tu pedido listo para enviar.
          </p>
        </footer>
      </aside>
    </>
  );
}

interface QuantityControlProps {
  quantity: number;
  name: string;
  atLimit: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

function QuantityControl({
  quantity,
  name,
  atLimit,
  onDecrease,
  onIncrease,
}: QuantityControlProps) {
  // Botones de 44x44px (estándar de área táctil en móvil).
  const buttonClass =
    "flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 transition-all duration-200 hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent disabled:active:scale-100 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:text-slate-600";

  return (
    <div className="flex shrink-0 items-center rounded-full bg-zinc-100 dark:bg-slate-800">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={
          quantity === 1 ? `Quitar ${name} del carrito` : `Quitar una unidad de ${name}`
        }
        className={buttonClass}
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <span
        className="min-w-6 text-center text-sm font-bold tabular-nums text-zinc-900 dark:text-white"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={atLimit}
        aria-label={`Agregar una unidad de ${name}`}
        title={atLimit ? "No hay más unidades disponibles" : undefined}
        className={buttonClass}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
