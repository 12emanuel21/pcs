import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import StatusScreen, { StatusIcon } from "@/components/store/StatusScreen";
import { SystemThemeScope } from "@/components/store/StoreThemeScope";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

// Cualquier URL que no corresponde a una ruta de la app.
export default function NotFound() {
  return (
    <SystemThemeScope>
      <StatusScreen
        visual={
          <StatusIcon>
            <SearchX size={30} strokeWidth={1.75} />
          </StatusIcon>
        }
        title="Página no encontrada"
        description="El enlace que abriste no existe o ya no está disponible. Revisa que esté completo."
      />
    </SystemThemeScope>
  );
}
