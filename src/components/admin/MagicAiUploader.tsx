"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { importProducts } from "@/app/admin/products/actions";
import { extractProductsWithAI } from "@/app/admin/products/ai-actions";
import ImportPreview, { ImportedBanner, type ParsedRow } from "@/components/admin/ImportPreview";
import { MAX_AI_INPUT_CHARS, validateImportRow } from "@/lib/product-import";

const PLACEHOLDER = `Pega aquí tu lista, como venga. Por ejemplo:

TECLADO REDRAGON KUMARA K552 RGB ..... $ 150.000  (12 und)
Mouse logitech g203 negro   85000
Monitor 24" Samsung curvo - 650.000 - quedan 3`;

function readFileAsText(file: File, encoding: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, encoding);
  });
}

// Importación mágica: el comerciante pega texto o sube un .csv/.txt
// desordenado, Gemini lo convierte en productos y se previsualizan con la
// misma tabla y validación de la importación clásica antes de guardar.
export default function MagicAiUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [source, setSource] = useState("Texto pegado");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isExtracting, startExtracting] = useTransition();
  const [isImporting, startImporting] = useTransition();

  const tooLong = text.length > MAX_AI_INPUT_CHARS;

  const handleFile = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      toast.error("El archivo debe ser .csv o .txt.");
      return;
    }
    try {
      let content = await readFileAsText(file, "UTF-8");
      // Excel en Windows suele guardar en Windows-1252: las tildes salen como
      // "�" al leer en UTF-8. En ese caso se vuelve a leer con esa codificación.
      if (content.includes("�")) content = await readFileAsText(file, "windows-1252");
      setText(content);
      setSource(file.name);
      setImportedCount(null);
    } catch {
      toast.error("No se pudo leer el archivo.");
    }
  };

  const handleExtract = () => {
    if (!text.trim() || tooLong) return;
    setImportedCount(null);

    startExtracting(async () => {
      const result = await extractProductsWithAI(text);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Misma validación que el CSV: lo que la IA devuelva no se guarda sin
      // pasar por validateImportRow (y el servidor la repite al importar).
      const parsed: ParsedRow[] = result.products.map((product, index) => {
        const validation = validateImportRow({ ...product });
        return {
          line: index + 1,
          rawName: product.name ?? "",
          rawPrice: String(product.price ?? ""),
          ...("error" in validation
            ? { error: validation.error }
            : { product: validation.product }),
        };
      });
      setRows(parsed);

      const zeroPrice = parsed.filter((row) => row.product?.price === 0).length;
      if (zeroPrice > 0) {
        toast.warning(
          `${zeroPrice} producto(s) quedaron con precio $0: Gemini no encontró su precio. Revísalos después de importar.`,
        );
      }
    });
  };

  const validProducts = rows?.flatMap((row) => (row.product ? [row.product] : [])) ?? [];

  const handleImport = () => {
    if (validProducts.length === 0) return;
    const toastId = toast.loading(`Importando ${validProducts.length} productos...`);

    startImporting(async () => {
      const result = await importProducts(validProducts);
      if (result.error) {
        toast.error(result.error, { id: toastId });
        if (result.imported > 0) setImportedCount(result.imported);
        return;
      }
      toast.success(`Se importaron ${result.imported} productos`, { id: toastId });
      setImportedCount(result.imported);
      setRows(null);
      setText("");
      setSource("Texto pegado");
    });
  };

  if (rows) {
    return (
      <ImportPreview
        icon={<Sparkles size={20} className="text-violet-500" />}
        title={source}
        rows={rows}
        lineLabel="#"
        resetLabel="Volver al texto"
        confirmLabel="Confirmar y Guardar"
        isPending={isImporting}
        onReset={() => setRows(null)}
        onConfirm={handleImport}
        showCategory
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {importedCount !== null && <ImportedBanner count={importedCount} />}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="magic-text" className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
            <FileText size={18} className="text-zinc-500 dark:text-zinc-400" />
            {source}
          </label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isExtracting}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Upload size={16} />
            Subir .csv o .txt
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="sr-only"
            tabIndex={-1}
          />
        </div>

        <textarea
          id="magic-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isExtracting}
          rows={12}
          spellCheck={false}
          placeholder={PLACEHOLDER}
          className="mt-3 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p
            className={`text-xs ${tooLong ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {text.length.toLocaleString("es-CO")} / {MAX_AI_INPUT_CHARS.toLocaleString("es-CO")} caracteres
            {tooLong && " · divide el texto en partes"}
          </p>
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || !text.trim() || tooLong}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isExtracting ? "Gemini está leyendo tu inventario..." : "Extraer con IA"}
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        El texto se envía a Google Gemini para ordenarlo. Revisa nombres,
        precios y categorías en la vista previa antes de guardar: la IA puede
        equivocarse.
      </p>
    </div>
  );
}
