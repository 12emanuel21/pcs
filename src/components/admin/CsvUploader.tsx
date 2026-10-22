"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { importProducts } from "@/app/admin/products/actions";
import ImportPreview, { ImportedBanner, type ParsedRow } from "@/components/admin/ImportPreview";
import {
  MAX_IMPORT_ROWS,
  normalizeHeader,
  validateImportRow,
} from "@/lib/product-import";

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
      {importedCount !== null && <ImportedBanner count={importedCount} />}

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
        <ImportPreview
          icon={<FileSpreadsheet size={20} className="text-zinc-500 dark:text-zinc-400" />}
          title={parsed.fileName}
          rows={parsed.rows}
          lineLabel="Fila"
          resetLabel="Elegir otro archivo"
          confirmLabel="Confirmar Importación"
          isPending={isPending}
          onReset={reset}
          onConfirm={handleImport}
        />
      )}
    </div>
  );
}
