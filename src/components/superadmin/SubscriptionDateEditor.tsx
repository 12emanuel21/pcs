"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Infinity as InfinityIcon, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { updateSubscriptionDate } from "@/app/superadmin/actions";
import RenewSubscriptionButton from "@/components/superadmin/RenewSubscriptionButton";

interface SubscriptionDateEditorProps {
  storeId: string;
  storeName: string;
  // YYYY-MM-DD (calendario de Bogotá) o null si es ilimitada.
  currentDate: string | null;
}

// Botón de lápiz que abre un modal para cambiar el vencimiento. Es un modal
// (fixed) y no un popover porque la tabla tiene overflow-x-auto y lo recortaría.
export default function SubscriptionDateEditor({
  storeId,
  storeName,
  currentDate,
}: SubscriptionDateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Editar vencimiento de ${storeName}`}
        title="Editar fecha"
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Pencil size={14} />
      </button>
      {isOpen && (
        <EditorDialog
          storeId={storeId}
          storeName={storeName}
          currentDate={currentDate}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function EditorDialog({
  storeId,
  storeName,
  currentDate,
  onClose,
}: SubscriptionDateEditorProps & { onClose: () => void }) {
  const [date, setDate] = useState(currentDate ?? "");
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (!isPending) onClose();
  };

  const save = (endDate: string | null) => {
    startTransition(async () => {
      const result = await updateSubscriptionDate(storeId, endDate);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        endDate
          ? `Vencimiento de ${storeName} actualizado.`
          : `${storeName} ahora tiene suscripción ilimitada.`,
      );
      onClose();
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (date) save(date);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-left"
      onClick={close}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <CalendarClock size={20} />
            Vencimiento
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{storeName}</p>

        <fieldset disabled={isPending} className="mt-4 flex flex-col gap-4">
          {/* Renovación rápida (pago recibido): suma 31 días al vencimiento
              vigente, o desde hoy si ya venció, y deja la tienda activa. */}
          <div>
            <RenewSubscriptionButton
              storeId={storeId}
              storeName={storeName}
              variant="dialog"
              onDone={onClose}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Suma 31 días a la fecha actual de corte (o desde hoy si ya venció)
              y reactiva la tienda si estaba suspendida.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            o elige una fecha
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Activa hasta (inclusive)
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-100"
            />
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              La tienda funciona todo ese día y se corta a la medianoche (hora
              de Colombia).
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => save(null)}
              disabled={currentDate === null}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <InfinityIcon size={16} />
              Dejar ilimitada
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Guardar fecha
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
