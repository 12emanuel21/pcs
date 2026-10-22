import { IMAGE_BUCKET, isHttpUrl, sanitizeFileName } from "@/lib/images";
import { createClient } from "@/utils/supabase/client";

// Convierte los campos crudos de <ImagePicker> en un único "{field}_url"
// según el contrato de parseImageField (ausente = conservar, "" = quitar,
// URL = nueva). field es el fieldName del ImagePicker ("image" por defecto,
// que produce "image_url"). Si hay un archivo nuevo lo sube a Storage. Se
// ejecuta en el navegador.
export async function resolveImageField(
  formData: FormData,
  storeId: string,
  filePrefix = "",
  field = "image",
): Promise<{ uploadedPath: string | null; error: string | null }> {
  const mode = formData.get(`${field}_mode`);
  const file = formData.get(field);
  const urlInput = String(formData.get(`${field}_url_input`) ?? "").trim();
  const remove = formData.get(`${field}_remove`) === "1";
  const output = `${field}_url`;

  for (const key of [`${field}_mode`, field, `${field}_url_input`, `${field}_remove`]) {
    formData.delete(key);
  }
  formData.delete(output);

  if (mode === "url" && urlInput) {
    if (!isHttpUrl(urlInput)) {
      return {
        uploadedPath: null,
        error: "El enlace debe empezar por http:// o https://.",
      };
    }
    formData.set(output, urlInput);
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
      output,
      supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl,
    );
    return { uploadedPath: path, error: null };
  }

  if (remove) formData.set(output, "");
  return { uploadedPath: null, error: null };
}

// Borra un archivo recién subido cuando la operación que lo usaba falló.
export async function discardUpload(path: string | null) {
  if (!path) return;
  await createClient().storage.from(IMAGE_BUCKET).remove([path]);
}
