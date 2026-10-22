"use client";

import { useId, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import ImagePicker from "@/components/admin/ImagePicker";
import { MAX_PRODUCT_COLORS, normalizeHexColor, productColors } from "@/lib/colors";
import { discardUpload, resolveImageField } from "@/lib/upload-image";
import type { Product } from "@/types";

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300";

interface ProductModalProps {
  storeId: string;
  // Si viene, el modal opera en modo edición y el disparador es un ícono.
  productToEdit?: Product | null;
  // Categorías ya usadas en la tienda, para sugerirlas al escribir.
  categories?: string[];
}

export default function ProductModal({
  storeId,
  productToEdit,
  categories = [],
}: ProductModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {productToEdit ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Editar ${productToEdit.name}`}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <Pencil size={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={16} />
          Nuevo Producto
        </button>
      )}

      {/* ProductForm se monta al abrir y se desmonta al cerrar, así que todo su
          estado (pestaña, URL, previsualización, archivo) se reinicia solo. */}
      {isOpen && (
        <ProductForm
          storeId={storeId}
          productToEdit={productToEdit ?? null}
          categories={categories}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

interface ProductFormProps {
  storeId: string;
  productToEdit: Product | null;
  categories: string[];
  onClose: () => void;
}

function ProductForm({
  storeId,
  productToEdit,
  categories,
  onClose,
}: ProductFormProps) {
  const categoryListId = useId();
  const isEditing = productToEdit !== null;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (!isPending) onClose();
  };

  // onSubmit en vez de action={...}: React 19 resetea el formulario al
  // terminar una form action, incluso si falló, y se perderían los datos.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const image = await resolveImageField(formData, storeId);
      if (image.error) {
        setError(image.error);
        return;
      }

      const result = productToEdit
        ? await updateProduct(productToEdit.id, formData)
        : await createProduct(formData);

      if (result.error) {
        // Evita dejar imágenes huérfanas si no se guardó el producto.
        await discardUpload(image.uploadedPath);
        setError(result.error);
        return;
      }

      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-left"
      onClick={close}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEditing ? "Editar Producto" : "Nuevo producto"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <fieldset
          disabled={isPending}
          className="mt-4 flex flex-col gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          <label className="flex flex-col gap-1">
            Nombre *
            <input
              name="name"
              required
              defaultValue={productToEdit?.name}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            Descripción
            <textarea
              name="description"
              rows={3}
              defaultValue={productToEdit?.description}
              className={`${inputClass} resize-none`}
            />
          </label>

          <label className="flex flex-col gap-1">
            Precio (COP) *
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              required
              placeholder="15000"
              defaultValue={productToEdit?.price}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            Stock disponible
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="Ilimitado"
              defaultValue={productToEdit?.stock ?? ""}
              className={inputClass}
            />
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              Deja en blanco si es ilimitado. Se descuenta al marcar un pedido
              como pagado.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            Categoría
            <input
              name="category"
              list={categoryListId}
              maxLength={50}
              autoComplete="off"
              placeholder="Ej: Accesorios"
              defaultValue={productToEdit?.category ?? ""}
              className={inputClass}
            />
            <datalist id={categoryListId}>
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              Opcional. Agrupa tus productos en la vitrina.
            </span>
          </label>

          <ColorsField initialColors={productColors(productToEdit?.colors)} />

          <div className="flex flex-col gap-2">
            Imagen
            <ImagePicker
              currentImage={productToEdit?.image_url ?? null}
              onError={setError}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isPending
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Guardar"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

// Colores disponibles: el selector nativo elige uno y "Añadir" lo suma a la
// lista. Cada color viaja al servidor en un input oculto "colors".
function ColorsField({ initialColors }: { initialColors: string[] }) {
  const [colors, setColors] = useState(initialColors);
  const [draft, setDraft] = useState("#000000");
  const isFull = colors.length >= MAX_PRODUCT_COLORS;

  const addColor = () => {
    const color = normalizeHexColor(draft);
    if (!color || isFull) return;
    setColors((current) => (current.includes(color) ? current : [...current, color]));
  };

  return (
    <div className="flex flex-col gap-2">
      Colores disponibles
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Elegir color"
          className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={addColor}
          disabled={isFull}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Plus size={16} />
          Añadir
        </button>
      </div>

      {colors.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <li
              key={color}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pr-1 pl-1.5 dark:border-zinc-700"
            >
              <span
                style={{ backgroundColor: color }}
                className="h-5 w-5 rounded-full border border-black/15 shadow-sm dark:border-white/20"
              />
              <span className="font-mono text-xs font-normal">{color}</span>
              <button
                type="button"
                onClick={() => setColors((current) => current.filter((c) => c !== color))}
                aria-label={`Quitar color ${color}`}
                className="rounded-full p-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X size={14} />
              </button>
              <input type="hidden" name="colors" value={color} />
            </li>
          ))}
        </ul>
      )}
      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
        Opcional. Se muestran como círculos en la vitrina; el cliente indica
        el que quiere al escribirte.
      </span>
    </div>
  );
}
