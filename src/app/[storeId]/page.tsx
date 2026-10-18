import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Cart from "@/components/Cart";
import StatusScreen from "@/components/store/StatusScreen";
import StoreLogo from "@/components/store/StoreLogo";
import Storefront from "@/components/store/Storefront";
import StorefrontSkeleton from "@/components/store/StorefrontSkeleton";
import StoreThemeScope, { SystemThemeScope } from "@/components/store/StoreThemeScope";
import ThemeToggle from "@/components/ThemeToggle";
import { brandStyle } from "@/lib/brand-colors";
import { storeFontClassName } from "@/lib/fonts";
import { getPublicStore } from "@/lib/store-data";
import { isStoreActive } from "@/lib/store-utils";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

// Título, descripción y vista previa al compartir el enlace (WhatsApp,
// Facebook...). Los bots de vista previa reciben estas etiquetas en el <head>
// sin streaming (Next los detecta por su user agent).
export async function generateMetadata({
  params,
}: PageProps<"/[storeId]">): Promise<Metadata> {
  const { storeId } = await params;
  const store = await getPublicStore(storeId).catch(() => null);
  if (!store) return { title: "Tienda no encontrada" };

  const description = `Mira el catálogo de ${store.name} y haz tu pedido por WhatsApp.`;
  const images = store.logo_url ? [{ url: store.logo_url, alt: store.name }] : undefined;

  return {
    // absolute: la vitrina lleva solo el nombre de la tienda, sin la marca
    // de la plataforma.
    title: { absolute: store.name },
    description,
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: store.name,
      title: store.name,
      description,
      images,
    },
    twitter: {
      card: "summary",
      title: store.name,
      description,
      images,
    },
  };
}

// Con cacheComponents, leer params o hacer fetch sin caché debe ocurrir
// dentro de un <Suspense>; si no, el build falla.
export default function StorePage({ params }: PageProps<"/[storeId]">) {
  return (
    <Suspense
      fallback={
        <SystemThemeScope>
          <StorefrontSkeleton />
        </SystemThemeScope>
      }
    >
      <StoreCatalog params={params} />
    </Suspense>
  );
}

async function StoreCatalog({ params }: Pick<PageProps<"/[storeId]">, "params">) {
  const { storeId } = await params;

  const store = await getPublicStore(storeId);
  if (!store) notFound();

  // Pausada manualmente o con la suscripción vencida: sin catálogo ni carrito.
  // connection(): isStoreActive usa la fecha actual, que con cacheComponents
  // solo puede leerse en el render por request.
  await connection();
  if (!isStoreActive(store)) {
    // Con el tema, la fuente y el color de la tienda: el comprador reconoce
    // dónde está aunque no pueda pedir.
    return (
      <StoreThemeScope
        storeId={store.id}
        defaultTheme={store.default_theme}
        style={brandStyle(store.theme_color)}
        className={`brand-scope flex flex-1 flex-col ${storeFontClassName(store.font_family)}`}
      >
        <StatusScreen
          visual={
            <StoreLogo
              name={store.name}
              logoUrl={store.logo_url}
              className="h-20 w-20 rounded-3xl text-3xl shadow-md ring-1 ring-black/5 dark:ring-white/10"
            />
          }
          title={store.name}
          description={
            <>
              Esta tienda no está recibiendo pedidos en este momento.
              <br />
              Vuelve a intentarlo más tarde.
            </>
          }
        />
      </StoreThemeScope>
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
            <StoreLogo
              name={store.name}
              logoUrl={store.logo_url}
              // Sobre el encabezado (ya del color de marca), la inicial va en
              // un recuadro translúcido.
              fallbackClassName="bg-white/20 text-brand-fg"
              className="h-14 w-14 shrink-0 rounded-2xl text-2xl shadow-md ring-2 ring-white/40 sm:h-16 sm:w-16"
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
      <Storefront initialProducts={products} />

      <Cart store={store} />
    </StoreThemeScope>
  );
}
