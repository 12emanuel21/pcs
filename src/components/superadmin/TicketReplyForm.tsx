"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { replyToTicket } from "@/app/superadmin/actions";
import { TICKET_STATUS_LABELS } from "@/components/TicketStatusBadge";
import { TICKET_STATUSES, type SupportTicket } from "@/types";

export default function TicketReplyForm({ ticket }: { ticket: SupportTicket }) {
  const [isPending, startTransition] = useTransition();

  // onSubmit en vez de action={...}: React 19 resetea el formulario al
  // terminar una form action, y la respuesta escrita se perdería si falla.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await replyToTicket(ticket.id, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ticket actualizado.");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      <fieldset disabled={isPending} className="flex flex-col gap-3">
        <textarea
          name="admin_reply"
          rows={3}
          defaultValue={ticket.admin_reply ?? ""}
          placeholder="Escribe la respuesta para el comerciante..."
          className="resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-100"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            Estado
            <select
              name="status"
              defaultValue={ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:text-slate-100"
            >
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TICKET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Guardar
          </button>
        </div>
      </fieldset>
    </form>
  );
}
