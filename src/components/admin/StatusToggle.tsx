"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

interface StatusToggleProps {
  isActive: boolean;
  // Server Action ya vinculada (ej: toggleProductStatus.bind(null, id, isActive)).
  action: () => Promise<{ error: string | null }>;
  activeLabel?: string;
  inactiveLabel?: string;
  activeTitle?: string;
  inactiveTitle?: string;
}

export default function StatusToggle({
  isActive,
  action,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  activeTitle = "Pausar",
  inactiveTitle = "Activar",
}: StatusToggleProps) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(isActive);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      setOptimisticActive(!isActive);
      const result = await action();
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimisticActive}
      onClick={handleClick}
      disabled={isPending}
      title={optimisticActive ? activeTitle : inactiveTitle}
      className="flex items-center gap-2 disabled:cursor-wait"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          optimisticActive ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            optimisticActive ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium ${
          optimisticActive ? "text-green-700 dark:text-green-300" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {optimisticActive ? activeLabel : inactiveLabel}
      </span>
    </button>
  );
}
