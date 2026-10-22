import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Store as StoreIcon } from "lucide-react";
import CsvUploader from "@/components/admin/CsvUploader";
import ImportModes from "@/components/admin/ImportModes";
import MagicAiUploader from "@/components/admin/MagicAiUploader";
import PageSkeleton from "@/components/admin/PageSkeleton";
import { getCurrentStore } from "@/lib/auth";
import { buildTemplateCsv } from "@/lib/product-import";

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(buildTemplateCsv())}`;

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ImportContent />
    </Suspense>
  );
}

async function ImportContent() {
  const { store } = await getCurrentStore();

  if (!store) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <StoreIcon className="mx-auto text-zinc-400 dark:text-zinc-500" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Aún no tienes una tienda asignada
        </h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} />
        Volver a productos
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Importar Productos
      </h1>
      <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
        Carga muchos productos a la vez en {store.name}. Se crean como nuevos
        y activos; los existentes no se modifican.
      </p>

      <div className="mt-6">
        <ImportModes
          classic={
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                  Llena la plantilla en Excel y guárdala como CSV (Archivo →
                  Guardar como → CSV).
                </p>
                <a
                  href={TEMPLATE_HREF}
                  download="plantilla-productos.csv"
                  className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Download size={16} />
                  Descargar Plantilla de Ejemplo
                </a>
              </div>
              <CsvUploader />
            </div>
          }
          magic={<MagicAiUploader />}
        />
      </div>
    </div>
  );
}
