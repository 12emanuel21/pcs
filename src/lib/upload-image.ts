import { IMAGE_BUCKET, isHttpUrl, sanitizeFileName } from "@/lib/images";
import { createClient } from "@/utils/supabase/client";

// Convierte los campos crudos de <ImagePicker> en un único "image_url" según
// el contrato de parseImageField (ausente = conservar, "" = quitar, URL = nueva).
// Si hay un archivo nuevo lo sube a Storage. Se ejecuta en el navegador.
export async function resolveImageField(
  formData: FormData,
  storeId: string,
  filePrefix = "",
): Promise<{ uploadedPath: string | null; error: string | null }> {
  const mode = formData.get("image_mode");
  const file = formData.get("image");
  const urlInput = String(formData.get("image_url_input") ?? "").trim();
  const remove = formData.get("image_remove") === "1";

  for (const key of ["image_mode", "image", "image_url_input", "image_remove"]) {
    formData.delete(key);
  }
  formData.delete("image_url");

  if (mode === "url" && urlInput) {
    if (!isHttpUrl(urlInput)) {
      return {
        uploadedPath: null,
        error: "El enlace debe empezar por http:// o https://.",
      };
    }
    formData.set("image_url", urlInput);
    return { uploadedPath: null, error: null };
  }

  if (mode === "file" && file instanceof File && file.size > 0) {
    const supabase = createClient();
    const path = `${storeId}/${filePrefix}${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (error) {
      return {
        uploadedPath: null,
        error: "No se pudo subir la imagen. Intenta de nuevo.",
      };
    }

    formData.set(
      "image_url",
      supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl,
    );
    return { uploadedPath: path, error: null };
  }

  if (remove) formData.set("image_url", "");
  return { uploadedPath: null, error: null };
}

// Borra un archivo recién subido cuando la operación que lo usaba falló.
export async function discardUpload(path: string | null) {
  if (!path) return;
  await createClient().storage.from(IMAGE_BUCKET).remove([path]);
}
