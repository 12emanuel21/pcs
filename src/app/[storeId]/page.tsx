import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Store as StoreIcon } from "lucide-react";
import Cart from "@/components/Cart";
import Storefront from "@/components/store/Storefront";
import StoreThemeScope from "@/components/store/StoreThemeScope";
import ThemeToggle from "@/components/ThemeToggle";
import { brandStyle } from "@/lib/brand-colors";
import { storeFontClassName } from "@/lib/fonts";
import { isStoreActive } from "@/lib/store-utils";
import { supabase } from "@/lib/supabase";
import type { Product, Store } from "@/types";

// Con cacheComponents, leer params o hacer fetch sin caché debe ocurrir
// dentro de un <Suspense>; si no, el build falla.
export default function StorePage({ params }: PageProps<"/[storeId]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-zinc-50 p-8 text-zinc-500 dark:bg-slate-950 dark:text-slate-400">
          Cargando tienda...
        </div>
      }
    >
      <StoreCatalog params={params} />
    </Suspense>
  );
}

async function StoreCatalog({ params }: Pick<PageProps<"/[storeId]">, "params">) {
  const { storeId } = await params;

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle<Store>();

  if (storeError) throw storeError;
  if (!store) notFound();

  // Pausada manualmente o con la suscripción vencida: sin catálogo ni carrito.
  // connection(): isStoreActive usa la fecha actual, que con cacheComponents
  // solo puede leerse en el render por request.
  await connection();
  if (!isStoreActive(store)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center dark:bg-slate-950">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-slate-800 dark:text-slate-400">
          <StoreIcon size={32} />
        </span>
        <h1 className="max-w-md text-xl font-semibold text-zinc-800 dark:text-slate-100">
          Esta tienda se encuentra temporalmente fuera de servicio.
        </h1>
      </div>
    );
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .returns<Product[]>();

  if (productsError) throw productsError;

  return (
    // Tipografía elegida en Ajustes + paleta de marca + tema de la tienda
    // (default_theme o la elección del comprador) para toda la vitrina,
    // incluido el carrito flotante.
    <StoreThemeScope
      storeId={store.id}
      defaultTheme={store.default_theme}
      style={brandStyle(store.theme_color)}
      className={`brand-scope min-h-full flex-1 bg-zinc-50 text-zinc-900 antialiased dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] ${storeFontClassName(store.font_family)}`}
    >
      <header className="relative overflow-hidden bg-brand text-brand-fg">
        {/* Brillo sutil para que el bloque de color no se vea plano. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10"
        />
        <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 sm:px-6 sm:py-8">
          {store.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-14 w-14 shrink-0 rounded-2xl bg-white object-cover shadow-md ring-2 ring-white/40 sm:h-16 sm:w-16"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {store.name}
            </h1>
            <p className="mt-0.5 text-sm opacity-80">
              Arma tu pedido y envíalo por WhatsApp
            </p>
          </div>
          <ThemeToggle className="-mr-2 self-start bg-black/10 hover:bg-black/20 sm:self-center" />
        </div>
      </header>

      {/* Buscador, categorías y grid filtrable (Client Component). */}
      <Storefront store={store} initialProducts={products} />

      <Cart store={store} />
    </StoreThemeScope>
  );
}
