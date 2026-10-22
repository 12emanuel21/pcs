"use client";

import { useCallback, useMemo, useState } from "react";
import {
  LayoutGrid,
  MessageCircle,
  PackageSearch,
  Search,
  Store as StoreIcon,
  UserRoundX,
  X,
} from "lucide-react";
import Cart from "@/components/Cart";
import ImageWithFallback from "@/components/store/ImageWithFallback";
import ProductDetailSheet from "@/components/store/ProductDetailSheet";
import ShowMoreButton from "@/components/store/ShowMoreButton";
import ProductImage from "@/components/store/ProductImage";
import StoreFooter from "@/components/store/StoreFooter";
import StoreLogo from "@/components/store/StoreLogo";
import GamerProductCard from "@/components/store/templates/GamerProductCard";
import {
  ALL_CATEGORIES,
  CARD_WIDTH_CLASS,
  useCatalogFilters,
} from "@/components/store/useCatalogFilters";
import ThemeToggle from "@/components/ThemeToggle";
import { categoryKey } from "@/lib/categories";
import type { StoreHero } from "@/lib/templates";
import type { Product, Store } from "@/types";

interface GamerThemeProps {
  store: Store;
  hero: StoreHero | null;
  initialProducts: Product[];
}

// Plantilla "gamer": tienda de alto impacto, en claro y en oscuro (sigue el
// tema de la tienda y el que elija el cliente con el botón de la cabecera).
// El contenedor y los textos llevan colores explícitos con su variante dark:
// (no heredan del body).
//
// Estructura: cabecera fija con buscador, portada partida (titular en dos
// tonos, botones y beneficios a la izquierda; foto protagonista con borde
// de marca a la derecha), barra de categorías, catálogo, pie y carrito.
export default function GamerTheme({ store, hero, initialProducts }: GamerThemeProps) {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    visibleProducts,
    remainingCount,
    showMore,
    hasFilters,
    clearFilters,
    noResultsDescription,
  } = useCatalogFilters(initialProducts);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const closeDetail = useCallback(() => setDetailProduct(null), []);

  // Producto estrella para la portada sin imagen: el elegido en Ajustes si
  // sigue visible; si no, el más caro con foto.
  const featured = useMemo(
    () =>
      initialProducts.find((product) => product.id === store.featured_product_id) ??
      initialProducts
        .filter((product) => product.image_url)
        .reduce<Product | null>((best, product) => (!best || product.price > best.price ? product : best), null),
    [initialProducts, store.featured_product_id],
  );

  // Foto de cada categoría para su círculo: la del primer producto con foto.
  const categoryImages = useMemo(() => {
    const images = new Map<string, string>();
    for (const product of initialProducts) {
      const key = categoryKey(product.category ?? "");
      if (key && product.image_url && !images.has(key)) images.set(key, product.image_url);
    }
    return images;
  }, [initialProducts]);

  const phone = store.whatsapp_number?.replace(/\D/g, "") ?? "";

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 dark:[color-scheme:dark]">
      <GamerHeader
        store={store}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        showSearch={initialProducts.length > 0}
      />

      <GamerHero store={store} hero={hero} featured={featured} phone={phone} />

      {initialProducts.length === 0 ? (
        <GamerEmptyState title="Esta tienda aún no tiene productos disponibles." />
      ) : (
        <>
          {categories.length > 0 && (
            <div className="mx-auto mt-2 w-full max-w-6xl px-4 sm:px-6">
              <div
                role="tablist"
                aria-label="Categorías"
                className="hide-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
              >
                {[ALL_CATEGORIES, ...categories].map((category) => {
                  const isActive = category === selectedCategory;
                  const image =
                    category === ALL_CATEGORIES ? null : categoryImages.get(categoryKey(category));
                  return (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedCategory(category)}
                      className="relative flex min-w-22 shrink-0 flex-col items-center gap-1.5 rounded-xl px-3 pt-1.5 pb-2.5 transition-colors duration-200 hover:bg-zinc-100 sm:flex-1 dark:hover:bg-zinc-800/70"
                    >
                      <span
                        className={`stage flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ${
                          image ? "bg-stage" : isActive ? "bg-brand text-brand-fg" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        } ${isActive ? "ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-zinc-900" : ""}`}
                      >
                        {image ? (
                          <ImageWithFallback
                            src={image}
                            alt=""
                            className="h-full w-full object-contain p-1.5 mix-blend-multiply"
                            fallback={<LayoutGrid size={20} />}
                          />
                        ) : (
                          <LayoutGrid size={20} />
                        )}
                      </span>
                      <span
                        className={`max-w-24 truncate text-[13px] ${
                          isActive ? "font-bold text-zinc-900 dark:text-zinc-50" : "font-medium text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {category}
                      </span>
                      {isActive && (
                        <span aria-hidden className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-brand" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <main
            id="catalogo"
            className="mx-auto w-full max-w-6xl flex-1 scroll-mt-20 px-4 pt-10 pb-14 sm:px-6"
          >
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase sm:text-3xl dark:text-zinc-50">
                  {selectedCategory === ALL_CATEGORIES ? "Productos" : selectedCategory}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "producto" : "productos"}
                  {searchTerm.trim() ? ` para "${searchTerm.trim()}"` : ""}
                </p>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-brand-ink hover:underline dark:text-brand"
                >
                  Ver todos
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <GamerEmptyState title="No se encontraron productos" description={noResultsDescription} />
            ) : (
              // Misma grilla que la minimalista: 2 columnas en móvil, 3 y 4 en
              // pantallas anchas, última fila centrada desde 3.
              <>
                <div className="flex flex-wrap gap-3 sm:gap-5 md:justify-center">
                  {visibleProducts.map((product) => (
                    <div key={product.id} className={CARD_WIDTH_CLASS}>
                      <GamerProductCard product={product} onOpenDetail={setDetailProduct} />
                    </div>
                  ))}
                </div>
                <ShowMoreButton remaining={remainingCount} onClick={showMore} className="mt-10" />
              </>
            )}
          </main>

          <ProductDetailSheet product={detailProduct} onClose={closeDetail} />
        </>
      )}

      <StoreFooter store={store} />
      <Cart store={store} />
    </div>
  );
}

// Cabecera fija: logo, nombre y botón de tema; el buscador va entre ellos
// desde md y en una segunda fila en celular.
function GamerHeader({
  store,
  searchTerm,
  onSearch,
  showSearch,
}: {
  store: Store;
  searchTerm: string;
  onSearch: (value: string) => void;
  showSearch: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2.5 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 md:flex-none">
          {store.logo_url && (
            <StoreLogo
              name={store.name}
              logoUrl={store.logo_url}
              className="h-9 w-9 shrink-0 rounded-lg text-base ring-1 ring-black/5 dark:ring-white/10"
            />
          )}
          <p className="truncate text-lg font-black tracking-tight text-zinc-900 uppercase dark:text-zinc-50">
            {store.name}
          </p>
        </div>

        {showSearch && (
          <label className="relative order-last block w-full md:order-none md:ml-auto md:w-auto md:max-w-md md:flex-1">
            <span className="sr-only">Buscar productos</span>
            <Search
              size={18}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={searchTerm}
              onChange={(e) => {
                onSearch(e.target.value);
                // Al buscar desde arriba, llevar al catálogo.
                document.getElementById("catalogo")?.scrollIntoView({ block: "start" });
              }}
              placeholder="Buscar productos"
              // text-base (16px): evita el zoom automático de iOS al enfocar.
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pr-11 pl-11 text-base text-zinc-900 outline-none transition-colors duration-200 placeholder:text-zinc-500 focus:border-brand dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearch("")}
                aria-label="Borrar búsqueda"
                className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-zinc-500 transition-colors duration-200 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            )}
          </label>
        )}

        <ThemeToggle className="-mr-1.5 shrink-0 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" />
      </div>
    </header>
  );
}

// Divide el titular en una parte clara y un remate en el color de marca.
// El comerciante puede marcar el corte con "|" o un salto de línea
// ("Arma tu PC | ideal"); si no, el remate es el último tercio de palabras.
// Una sola palabra va toda en color de marca.
function splitHeadline(title: string): [string, string] {
  const manual = title.split(/\s*[|\n]\s*/);
  if (manual.length > 1) return [manual[0], manual.slice(1).join(" ")];
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return ["", words[0]];
  const accentCount = Math.max(1, Math.round(words.length / 3));
  return [words.slice(0, -accentCount).join(" "), words.slice(-accentCount).join(" ")];
}

const BENEFITS = [
  { icon: MessageCircle, title: "Pedido por WhatsApp", detail: "Lo envías en un toque" },
  { icon: UserRoundX, title: "Sin registrarte", detail: "Ni cuentas ni pagos en línea" },
  { icon: StoreIcon, title: "Directo con la tienda", detail: "Te responde quien vende" },
] as const;

// Portada partida: titular en dos tonos, subtítulo, botones y beneficios a
// la izquierda; a la derecha la imagen de portada (o el producto estrella
// sobre la vitrina) con un borde diagonal del color de marca.
function GamerHero({
  store,
  hero,
  featured,
  phone,
}: {
  store: Store;
  hero: StoreHero | null;
  featured: Product | null;
  phone: string;
}) {
  const [lead, accent] = splitHeadline(hero?.title ?? store.name);
  const subtitle = hero?.subtitle ?? "Arma tu pedido y envíalo por WhatsApp en minutos.";
  const hasVisual = Boolean(hero?.imageUrl || featured);

  return (
    <section className="relative overflow-hidden">
      {/* Halo suave del color de marca detrás del titular. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
      />
      <div
        className={`relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-12 sm:px-6 md:pt-16 md:pb-16 ${
          hasVisual ? "md:grid-cols-[1.05fr_1fr]" : ""
        }`}
      >
        <div>
          {/* leading 1.02: con menos, las tildes de las mayúsculas (Í, Á) chocan
              con la línea de arriba. */}
          <h1 className="text-[clamp(2.5rem,9vw,4.75rem)] leading-[1.02] font-black tracking-tight text-balance uppercase">
            {lead && <span className="block text-zinc-900 dark:text-zinc-50">{lead}</span>}
            <span className="block text-brand-ink dark:text-brand">{accent}</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-zinc-600 sm:text-lg dark:text-zinc-300">{subtitle}</p>

          {/* En celular, los dos botones a todo el ancho (uno debajo del
              otro); desde sm, en fila. */}
          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <a
              href="#catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-7 text-[15px] font-bold text-brand-fg transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Ver productos
            </a>
            {phone && (
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 text-[15px] font-bold text-zinc-900 transition-colors duration-200 hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
              >
                <MessageCircle size={18} />
                Escribir por WhatsApp
              </a>
            )}
          </div>

          {/* En celular: tres columnas compactas (ícono y título) para no
              empujar el catálogo; desde sm, con el detalle al lado. */}
          <ul className="mt-8 grid grid-cols-3 gap-3 sm:mt-9 sm:gap-5">
            {BENEFITS.map(({ icon: Icon, title, detail }) => (
              <li
                key={title}
                className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left"
              >
                <Icon size={22} className="shrink-0 text-brand-ink sm:mt-0.5 dark:text-brand" />
                <span>
                  <span className="block text-[13px] leading-tight font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
                    {title}
                  </span>
                  <span className="hidden text-[13px] text-zinc-500 sm:block dark:text-zinc-400">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {hasVisual && (
          // Borde diagonal: una capa del color de marca asoma unos píxeles
          // por la izquierda, recortada igual que la imagen.
          <div className="relative aspect-[16/10] w-full md:aspect-square">
            <div
              aria-hidden
              className="absolute inset-0 -translate-x-2 rounded-r-3xl bg-brand [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]"
            />
            <div className="absolute inset-0 overflow-hidden rounded-r-3xl [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]">
              {hero?.imageUrl ? (
                <ImageWithFallback
                  src={hero.imageUrl}
                  alt=""
                  loading="eager"
                  className="h-full w-full object-cover"
                  fallback={<div className="h-full w-full bg-zinc-200 dark:bg-zinc-900" />}
                />
              ) : (
                featured && (
                  <div className="stage h-full w-full bg-stage pl-[10%]">
                    <ProductImage src={featured.image_url} name={featured.name} size="detail" />
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function GamerEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-brand-ink dark:border-zinc-800 dark:bg-zinc-900 dark:text-brand">
        <PackageSearch size={30} />
      </span>
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      {description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
    </div>
  );
}
