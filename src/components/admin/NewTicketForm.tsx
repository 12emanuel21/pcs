"use client";

import { useRef, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createSupportTicket } from "@/app/admin/support/actions";

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 font-normal text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300";

export default function NewTicketForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  // onSubmit en vez de action={...}: React 19 resetea el formulario al
  // terminar una form action, incluso si falló. Aquí solo se limpia al enviar.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createSupportTicket(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ticket enviado. Te responderemos pronto.");
      formRef.current?.reset();
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nuevo ticket</h2>
      <fieldset
        disabled={isPending}
        className="mt-4 flex flex-col gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        <label className="flex flex-col gap-1">
          Asunto *
          <input
            name="subject"
            required
            maxLength={150}
            placeholder="Ej: No puedo subir imágenes"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          Mensaje *
          <textarea
            name="message"
            required
            rows={5}
            maxLength={5000}
            placeholder="Cuéntanos qué pasó y qué necesitas."
            className={`${inputClass} resize-y`}
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {isPending ? "Enviando..." : "Enviar ticket"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
