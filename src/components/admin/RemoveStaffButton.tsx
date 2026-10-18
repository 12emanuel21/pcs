"use client";

import { useTransition } from "react";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { removeStaff } from "@/app/admin/staff/actions";

export default function RemoveStaffButton({
  staffId,
  email,
}: {
  staffId: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (
      !confirm(
        `¿Quitar a ${email} de la tienda? Perderá el acceso al panel de inmediato.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await removeStaff(staffId);
      if (result.error) toast.error(result.error);
      else toast.success(`${email} ya no tiene acceso a la tienda.`);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
      Quitar
    </button>
  );
}
