"use server";

import { revalidatePath } from "next/cache";
import { getOwnerStore } from "@/lib/auth";
import { parseProductColors } from "@/lib/colors";
import { parseImageField } from "@/lib/images";
import {
  MAX_CATEGORY_LENGTH,
  MAX_IMPORT_ROWS,
  normalizeCategory,
  parseStock,
  validateImportRow,
} from "@/lib/product-import";
import { removeStoreImage } from "@/lib/storage";
import type { Product } from "@/types";

export interface ActionResult {
  error: string | null;
}

function revalidateStore(storeId: string) {
  revalidatePath("/admin");
  revalidatePath(`/${storeId}`);
}

// Valida los campos comunes de crear/editar. imageUrl sigue el contrato de
// parseImageField: undefined = conservar, null = quitar, string = nueva.
function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const category = normalizeCategory(formData.get("category"));
  const stock = parseStock(formData.get("stock"));

  if (!name) return { error: "El nombre es obligatorio." };
  if (category && category.length > MAX_CATEGORY_LENGTH) {
    return {
      error: `La categoría no puede superar ${MAX_CATEGORY_LENGTH} caracteres.`,
    };
  }
  if (stock === "invalid") {
    return {
      error: "El stock debe ser un número entero mayor o igual a 0, o vacío si es ilimitado.",
    };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: "El precio debe ser un número mayor o igual a 0." };
  }

  // Un input oculto "colors" por cada color elegido en el modal.
  const colors = parseProductColors(formData.getAll("colors"));
  if ("error" in colors) return { error: colors.error };

  const image = parseImageField(formData);
  if ("error" in image) return { error: image.error };

  return {
    name,
    description,
    price: Math.round(price),
    category,
    stock,
    colors: colors.colors,
    imageUrl: image.value,
  };
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const fields = parseProductForm(formData);
  if ("error" in fields) return { error: fields.error ?? null };

  const { error } = await ctx.supabase.from("products").insert({
    store_id: ctx.storeId,
    name: fields.name,
    description: fields.description,
    price: fields.price,
    category: fields.category,
    stock: fields.stock,
    colors: fields.colors,
    image_url: fields.imageUrl ?? null,
    is_active: true,
  });

  if (error) return { error: "No se pudo crear el producto." };

  revalidateStore(ctx.storeId);
  return { error: null };
}

export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const fields = parseProductForm(formData);
  if ("error" in fields) return { error: fields.error ?? null };

  const { data: existing } = await ctx.supabase
    .from("products")
    .select("image_url")
    .eq("id", productId)
    .eq("store_id", ctx.storeId)
    .maybeSingle<{ image_url: string | null }>();

  if (!existing) return { error: "El producto no existe o no es tuyo." };

  // undefined = sin imagen nueva: se conserva la actual.
  const imageUrl =
    fields.imageUrl === undefined ? existing.image_url : fields.imageUrl;

  const { data, error } = await ctx.supabase
    .from("products")
    .update({
      name: fields.name,
      description: fields.description,
      price: fields.price,
      category: fields.category,
      stock: fields.stock,
      colors: fields.colors,
      image_url: imageUrl,
    })
    .eq("id", productId)
    .eq("store_id", ctx.storeId)
    .select("id");

  // RLS puede bloquear el update sin devolver error: se valida que afectó 1 fila.
  if (error || !data?.length) {
    return { error: "No se pudo actualizar el producto." };
  }

  if (imageUrl !== existing.image_url) {
    await removeStoreImage(ctx.supabase, ctx.storeId, existing.image_url);
  }

  revalidateStore(ctx.storeId);
  return { error: null };
}

const IMPORT_BATCH_SIZE = 100;

// Cargue masivo desde CSV. Solo INSERTA productos nuevos: ignora cualquier
// id/store_id que venga del cliente (en Modo Soporte el cliente es service
// role, y un upsert por id podría pisar productos de otra tienda). Cada fila
// se vuelve a validar aquí; el navegador no es de confianza.
export async function importProducts(
  products: Partial<Product>[],
): Promise<ActionResult & { imported: number }> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null, imported: 0 };

  if (!Array.isArray(products) || products.length === 0) {
    return { error: "No hay productos para importar.", imported: 0 };
  }
  if (products.length > MAX_IMPORT_ROWS) {
    return {
      error: `Máximo ${MAX_IMPORT_ROWS} productos por archivo. Divide el CSV en partes.`,
      imported: 0,
    };
  }

  const rows = [];
  for (const [index, raw] of products.entries()) {
    const result = validateImportRow({ ...raw });
    if ("error" in result) {
      return { error: `Producto ${index + 1}: ${result.error}.`, imported: 0 };
    }
    rows.push({
      ...result.product,
      id: crypto.randomUUID(),
      store_id: ctx.storeId,
      is_active: true,
    });
  }

  // Por lotes para no exceder el tamaño de request de PostgREST. Si un lote
  // falla, se informa cuántos alcanzaron a guardarse.
  let imported = 0;
  for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
    const batch = rows.slice(i, i + IMPORT_BATCH_SIZE);
    const { error } = await ctx.supabase.from("products").insert(batch);

    if (error) {
      if (imported > 0) revalidateStore(ctx.storeId);
      return {
        error:
          imported > 0
            ? `Se importaron ${imported} productos, pero falló el resto: ${error.message}`
            : `No se pudieron importar los productos: ${error.message}`,
        imported,
      };
    }
    imported += batch.length;
  }

  revalidateStore(ctx.storeId);
  return { error: null, imported };
}

export async function toggleProductStatus(
  productId: string,
  currentStatus: boolean,
): Promise<ActionResult> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const { data, error } = await ctx.supabase
    .from("products")
    .update({ is_active: !currentStatus })
    .eq("id", productId)
    .eq("store_id", ctx.storeId)
    .select("id");

  if (error || !data?.length) {
    return { error: "No se pudo actualizar el producto." };
  }

  revalidateStore(ctx.storeId);
  return { error: null };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const ctx = await getOwnerStore();
  if ("error" in ctx) return { error: ctx.error ?? null };

  const { data, error } = await ctx.supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", ctx.storeId)
    .select("id, image_url")
    .returns<{ id: string; image_url: string | null }[]>();

  if (error || !data?.length) {
    return { error: "No se pudo eliminar el producto." };
  }

  await removeStoreImage(ctx.supabase, ctx.storeId, data[0].image_url);

  revalidateStore(ctx.storeId);
  return { error: null };
}
