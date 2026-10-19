import { Suspense } from "react";
import PageSkeleton from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { FileSpreadsheet, ImageOff } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import NoStoreNotice from "@/components/admin/NoStoreNotice";
import ProductModal from "@/components/admin/ProductModal";
import StatusToggle from "@/components/admin/StatusToggle";
import { toggleProductStatus } from "@/app/admin/products/actions";
import { getCurrentStore } from "@/lib/auth";
import { uniqueCategories } from "@/lib/categories";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/types";

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  const { supabase, store } = await getCurrentStore();

  if (!store) return <NoStoreNotice />;

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("name")
    .returns<Product[]>();

  if (productsError) throw productsError;

  const categories = uniqueCategories(products);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Productos{" "}
          <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
            ({products.length})
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/import"
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet size={16} />
            Importar Excel/CSV
          </Link>
          <ProductModal storeId={store.id} categories={categories} />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Todavía no tienes productos. Crea el primero con
                  &quot;Nuevo Producto&quot;.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                          <ImageOff size={18} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {product.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatCOP(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <StockLabel stock={product.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle
                      isActive={product.is_active}
                      action={toggleProductStatus.bind(
                        null,
                        product.id,
                        product.is_active,
                      )}
                      activeTitle="Pausar producto"
                      inactiveTitle="Activar producto"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <ProductModal
                        storeId={store.id}
                        productToEdit={product}
                        categories={categories}
                      />
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockLabel({ stock }: { stock?: number | null }) {
  if (stock === null || stock === undefined) {
    return <span className="text-zinc-400 dark:text-zinc-500">Ilimitado</span>;
  }
  if (stock === 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
        Agotado
      </span>
    );
  }
  return (
    <span className={stock <= 3 ? "font-medium text-amber-700 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"}>
      {stock}
    </span>
  );
}
