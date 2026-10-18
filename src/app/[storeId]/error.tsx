"use client";

import { useEffect, useTransition } from "react";
import { Loader2, RotateCw, WifiOff } from "lucide-react";
import StatusScreen, { StatusIcon } from "@/components/store/StatusScreen";
import { SystemThemeScope } from "@/components/store/StoreThemeScope";

// Error al cargar la vitrina (Supabase caído, sin conexión...). retry()
// vuelve a pedir la página sin recargar el navegador.
export default function StoreError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const [isRetrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SystemThemeScope>
      <StatusScreen
        visual={
          <StatusIcon>
            <WifiOff size={30} strokeWidth={1.75} />
          </StatusIcon>
        }
        title="No pudimos cargar la tienda"
        description="Puede ser un problema de conexión. Revisa tu internet e inténtalo de nuevo."
        action={
          <button
            type="button"
            onClick={() => startTransition(retry)}
            disabled={isRetrying}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 sm:w-auto dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isRetrying ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RotateCw size={18} />
            )}
            Intentar de nuevo
          </button>
        }
      />
    </SystemThemeScope>
  );
}
