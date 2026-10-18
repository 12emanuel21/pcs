import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/types";

// Tienda por id para la vitrina pública. cache(): generateMetadata y la
// página la piden en el mismo request y solo se consulta una vez.
export const getPublicStore = cache(async (storeId: string) => {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle<Store>();

  if (error) throw error;
  return data;
});
