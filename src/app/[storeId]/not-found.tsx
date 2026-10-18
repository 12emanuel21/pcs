import { SearchX } from "lucide-react";
import StatusScreen, { StatusIcon } from "@/components/store/StatusScreen";
import { SystemThemeScope } from "@/components/store/StoreThemeScope";

// Tienda inexistente (notFound() en la página de la vitrina).
export default function StoreNotFound() {
  return (
    <SystemThemeScope>
      <StatusScreen
        visual={
          <StatusIcon>
            <SearchX size={30} strokeWidth={1.75} />
          </StatusIcon>
        }
        title="No encontramos esta tienda"
        description="Revisa que el enlace o el código QR estén completos. Si el problema sigue, pídele a la tienda que te comparta su enlace de nuevo."
      />
    </SystemThemeScope>
  );
}
