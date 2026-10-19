"use client";

import { useTransition } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extendSubscription } from "@/app/superadmin/actions";
import { formatSubscriptionDate } from "@/lib/store-utils";

const DAYS = 31;

interface RenewSubscriptionButtonProps {
  storeId: string;
  storeName: string;
  // "row": botón compacto en la tabla; "dialog": botón destacado del modal.
  variant?: "row" | "dialog";
  onDone?: () => void;
}

// Renovación rápida: +31 días sobre el vencimiento vigente (o desde hoy si
// ya venció). La regla vive en la Server Action extendSubscription.
export default function RenewSubscriptionButton({
  storeId,
  storeName,
  variant = "row",
  onDone,
}: RenewSubscriptionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const renew = () => {
    startTransition(async () => {
      const result = await extendSubscription(storeId, DAYS);
      if (result.error || !result.newEndDate) {
        toast.error(result.error ?? "No se pudo renovar la suscripción.");
        return;
      }
      toast.success(
        `${storeName}: nueva fecha de corte ${formatSubscriptionDate(result.newEndDate)}${
          result.reactivated ? " (tienda reactivada)" : ""
        }.`,
      );
      onDone?.();
    });
  };

  if (variant === "dialog") {
    return (
      <button
        type="button"
        onClick={renew}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
        +1 Mes (+{DAYS} días)
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={renew}
      disabled={isPending}
      title={`Renovar ${DAYS} días`}
      aria-label={`Renovar ${storeName} por ${DAYS} días`}
      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : <CalendarPlus size={12} />}
      +{DAYS} d
    </button>
  );
}
