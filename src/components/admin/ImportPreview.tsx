"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { formatCOP } from "@/lib/format";
import type { ImportProductInput } from "@/lib/product-import";

const PREVIEW_ROWS = 10;

export interface ParsedRow {
  line: number; // fila en el archivo (CSV) o posición en la lista (IA)
  product?: ImportProductInput;
  error?: string;
  rawName: string;
  rawPrice: string;
}

interface ImportPreviewProps {
  // Ícono y nombre de lo que se está importando (archivo o "Texto pegado").
  icon: React.ReactNode;
  title: string;
  rows: ParsedRow[];
  // Encabezado de la primera columna ("Fila" en CSV, "#" en IA).
  lineLabel: string;
  resetLabel: string;
  confirmLabel: string;
  isPending: boolean;
  onReset: () => void;
  onConfirm: () => void;
  // Columna extra con la categoría (la IA la deduce y conviene revisarla).
  showCategory?: boolean;
}

// Previsualización compartida por la importación clásica (CSV) y la mágica
// (IA): conteo de válidos y errores, primeras filas, detalle de errores y
// botón de confirmar.
export default function ImportPreview({
  icon,
  title,
  rows,
  lineLabel,
  resetLabel,
  confirmLabel,
  isPending,
  onReset,
  onConfirm,
  showCategory = false,
}: ImportPreviewProps) {
  const validCount = rows.filter((row) => row.product).length;
  const invalidRows = rows.filter((row) => row.error);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {validCount} válidos
            {invalidRows.length > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {" "}
                · {invalidRows.length} con errores
              </span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <X size={14} />
          {resetLabel}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2">{lineLabel}</th>
              <th className="px-3 py-2">Nombre</th>
              {showCategory && <th className="px-3 py-2">Categoría</th>}
              <th className="px-3 py-2 text-right">Precio</th>
              {showCategory && <th className="px-3 py-2 text-right">Stock</th>}
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.slice(0, PREVIEW_ROWS).map((row) => (
              <tr key={row.line} className={row.error ? "bg-red-50/60 dark:bg-red-950/30" : ""}>
                <td className="px-3 py-2 tabular-nums text-zinc-400 dark:text-zinc-500">{row.line}</td>
                <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                  {row.product?.name ?? (row.rawName || "—")}
                </td>
                {showCategory && (
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {row.product?.category || "—"}
                  </td>
                )}
                <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {row.product ? formatCOP(row.product.price) : row.rawPrice || "—"}
                </td>
                {showCategory && (
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {row.product?.stock ?? "∞"}
                  </td>
                )}
                <td className="px-3 py-2">
                  {row.error ? (
                    <span className="flex items-center gap-1 text-xs text-red-700 dark:text-red-300">
                      <AlertCircle size={14} />
                      {row.error}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                      <CheckCircle2 size={14} />
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > PREVIEW_ROWS && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Mostrando {PREVIEW_ROWS} de {rows.length} filas.
        </p>
      )}

      {invalidRows.length > 0 && (
        <details className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <summary className="cursor-pointer font-medium">
            {invalidRows.length} fila(s) con errores no se importarán
          </summary>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {invalidRows.slice(0, 50).map((row) => (
              <li key={row.line}>
                {lineLabel === "#" ? "Producto" : "Fila"} {row.line}: {row.error}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending || validCount === 0}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "Importando..." : `${confirmLabel} (${validCount})`}
        </button>
      </div>
    </section>
  );
}

// Aviso de éxito tras importar, con enlace al listado de productos.
export function ImportedBanner({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
      <span className="flex items-center gap-2">
        <CheckCircle2 size={16} />
        Se importaron {count} productos. Quedaron activos en tu catálogo.
      </span>
      <Link href="/admin" className="font-medium underline">
        Ver productos
      </Link>
    </div>
  );
}
