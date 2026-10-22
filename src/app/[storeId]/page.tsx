import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import StatusScreen from "@/components/store/StatusScreen";
import StoreLogo from "@/components/store/StoreLogo";
import StorefrontTemplate from "@/components/store/StorefrontTemplate";
import StorefrontSkeleton from "@/components/store/StorefrontSkeleton";
import StoreThemeScope, { SystemThemeScope } from "@/components/store/StoreThemeScope";
import { brandStyle } from "@/lib/brand-colors";
import { storeFontClassName } from "@/lib/fonts";
import { getPublicStore } from "@/lib/store-data";
import { isStoreActive } from "@/lib/store-utils";
import { getStoreHero, resolveTemplate } from "@/lib/templates";
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

  const template = resolveTemplate(store.template);

  return (
    // Tipografía elegida en Ajustes + paleta de marca + tema de la tienda
    // (default_theme o la elección del comprador) para toda la vitrina. La
    // plantilla arma el resto (cabecera, catálogo, pie y carrito); la gamer
    // fuerza el oscuro en su propio contenedor, así que el fondo de aquí
    // también es oscuro para que no asome blanco al estirar la página.
    <StoreThemeScope
      storeId={store.id}
      defaultTheme={store.default_theme}
      style={brandStyle(store.theme_color)}
      className={`brand-scope min-h-full flex-1 antialiased ${
        template === "gamer"
          ? "bg-zinc-950 text-zinc-100"
          : "bg-white text-zinc-900 dark:bg-black dark:text-zinc-100 dark:[color-scheme:dark]"
      } ${storeFontClassName(store.font_family)}`}
    >
      <StorefrontTemplate
        template={template}
        store={store}
        hero={getStoreHero(store)}
        initialProducts={products}
      />
    </StoreThemeScope>
  );
}
