import type { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_BUCKET, storeImagePrefix } from "@/lib/images";

// Borra del bucket una imagen de la tienda. URLs externas o de otra tienda se
// ignoran. Si falla, solo queda un archivo huérfano, así que no se propaga.
export async function removeStoreImage(
  supabase: SupabaseClient,
  storeId: string,
  imageUrl: string | null,
) {
  const prefix = storeImagePrefix(storeId);
  if (!imageUrl?.startsWith(prefix)) return;

  const path = `${storeId}/${decodeURIComponent(imageUrl.slice(prefix.length))}`;
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}
