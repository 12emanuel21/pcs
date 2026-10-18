"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { importProducts } from "@/app/admin/products/actions";
import { formatCOP } from "@/lib/format";
import {
  MAX_IMPORT_ROWS,
  normalizeHeader,
  validateImportRow,
  type ImportProductInput,
} from "@/lib/product-import";

const PREVIEW_ROWS = 10;

interface ParsedRow {
  line: number; // número de fila en el archivo (1 = encabezado)
  product?: ImportProductInput;
  error?: string;
  rawName: string;
  rawPrice: string;
}

interface ParsedFile {
  fileName: string;
  rows: ParsedRow[];
}

type CsvRecord = Record<string, string>;

function runPapa<T>(
  file: File,
  config: Papa.ParseConfig<T> & { encoding?: string },
) {
  return new Promise<Papa.ParseResult<T>>((resolve, reject) => {
    Papa.parse<T>(file, { ...config, complete: resolve, error: reject });
  });
}

// Separador fijo "," (el de la plantilla). Excepción: Excel en español guarda
// los CSV con ";", y entonces todo el encabezado queda en una sola columna que
// contiene ";"; en ese caso se vuelve a leer con ";".
// Se conservan las filas vacías para que el número de fila mostrado coincida
// con el de Excel; se filtran después.
async function parseCsv(file: File, encoding: string) {
  const parseWith = (delimiter: string) =>
    runPapa<CsvRecord>(file, {
      header: true,
      skipEmptyLines: false,
      delimiter,
      encoding,
      transformHeader: normalizeHeader,
    });

  const result = await parseWith(",");
  const fields = result.meta.fields ?? [];
  if (fields.length === 1 && fields[0].includes(";")) {
    return parseWith(";");
  }
  return result;
}

export default function CsvUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setParsed(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImportedCount(null);

    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("El archivo debe ser .csv. En Excel: Archivo → Guardar como → CSV.");
      return;
    }

    setIsReading(true);
    try {
      let result = await parseCsv(file, "UTF-8");
      // Excel en Windows suele guardar en Windows-1252: las tildes salen como
      // "�" al leer en UTF-8. En ese caso se vuelve a leer con esa codificación.
      if (JSON.stringify(result.data).includes("�")) {
        result = await parseCsv(file, "windows-1252");
      }

      const columns = result.meta.fields ?? [];
      const missing = ["name", "price"].filter((col) => !columns.includes(col));
      if (missing.length > 0) {
        toast.error(
          `Faltan columnas obligatorias: ${missing.join(", ")}. Usa la plantilla de ejemplo.`,
        );
        reset();
        return;
      }
      // Fila de Excel = índice + 2 (la fila 1 es el encabezado).
      const records = result.data
        .map((record, index) => ({ record, line: index + 2 }))
        .filter(({ record }) =>
          Object.values(record).some((value) => String(value ?? "").trim() !== ""),
        );

      if (records.length === 0) {
        toast.error("El archivo no tiene productos.");
        reset();
        return;
      }
      if (records.length > MAX_IMPORT_ROWS) {
        toast.error(
          `El archivo tiene ${records.length} filas. El máximo es ${MAX_IMPORT_ROWS}; divídelo en partes.`,
        );
        reset();
        return;
      }

      const rows: ParsedRow[] = records.map(({ record, line }) => {
        const validation = validateImportRow(record);
        return {
          line,
          rawName: record.name ?? "",
          rawPrice: record.price ?? "",
          ...("error" in validation
            ? { error: validation.error }
            : { product: validation.product }),
        };
      });

      setParsed({ fileName: file.name, rows });
      const errors = rows.filter((row) => row.error).length;
      if (errors > 0) {
        toast.warning(`${errors} fila(s) con errores no se importarán.`);
      }
    } catch {
      toast.error("No se pudo leer el archivo. Verifica que sea un CSV válido.");
      reset();
    } finally {
      setIsReading(false);
    }
  };

  const validProducts =
    parsed?.rows.flatMap((row) => (row.product ? [row.product] : [])) ?? [];
  const invalidRows = parsed?.rows.filter((row) => row.error) ?? [];

  const handleImport = () => {
    if (validProducts.length === 0) return;
    const toastId = toast.loading(`Importando ${validProducts.length} productos...`);

    startTransition(async () => {
      const result = await importProducts(validProducts);
      if (result.error) {
        toast.error(result.error, { id: toastId });
        if (result.imported > 0) setImportedCount(result.imported);
        return;
      }
      toast.success(`Se importaron ${result.imported} productos`, { id: toastId });
      setImportedCount(result.imported);
      reset();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {importedCount !== null && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            Se importaron {importedCount} productos. Quedaron activos en tu catálogo.
          </span>
          <Link href="/admin" className="font-medium underline">
            Ver productos
          </Link>
        </div>
      )}

      {!parsed ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            isDragging
              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
              : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
          }`}
        >
          {isReading ? (
            <Loader2 size={32} className="animate-spin text-zinc-400 dark:text-zinc-500" />
          ) : (
            <Upload size={32} className="text-zinc-400 dark:text-zinc-500" />
          )}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {isReading
              ? "Leyendo archivo..."
              : "Arrastra tu archivo .csv aquí o toca para elegirlo"}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Columnas: name y price (obligatorias), description e image_url
            (opcionales). Máximo {MAX_IMPORT_ROWS} productos.
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-zinc-500 dark:text-zinc-400" />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{parsed.fileName}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                · {validProducts.length} válidos
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
              onClick={reset}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X size={14} />
              Elegir otro archivo
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {parsed.rows.slice(0, PREVIEW_ROWS).map((row) => (
                  <tr key={row.line} className={row.error ? "bg-red-50/60 dark:bg-red-950/30" : ""}>
                    <td className="px-3 py-2 tabular-nums text-zinc-400 dark:text-zinc-500">{row.line}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                      {row.product?.name ?? (row.rawName || "—")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {row.product ? formatCOP(row.product.price) : row.rawPrice || "—"}
                    </td>
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
          {parsed.rows.length > PREVIEW_ROWS && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Mostrando {PREVIEW_ROWS} de {parsed.rows.length} filas.
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
                    Fila {row.line}: {row.error}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={isPending || validProducts.length === 0}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isPending
                ? "Importando..."
                : `Confirmar Importación (${validProducts.length})`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
