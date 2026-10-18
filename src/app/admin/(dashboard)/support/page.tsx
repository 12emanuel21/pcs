import { Suspense } from "react";
import { MessageSquareReply, Store as StoreIcon } from "lucide-react";
import NewTicketForm from "@/components/admin/NewTicketForm";
import PageSkeleton from "@/components/admin/PageSkeleton";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import { getCurrentStore } from "@/lib/auth";
import type { SupportTicket } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SupportContent />
    </Suspense>
  );
}

async function SupportContent() {
  const { supabase, store } = await getCurrentStore();

  if (!store) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <StoreIcon className="mx-auto text-zinc-400 dark:text-zinc-500" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Aún no tienes una tienda asignada
        </h1>
      </div>
    );
  }

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .returns<SupportTicket[]>();

  if (error) throw error;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Soporte</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        ¿Tienes un problema o necesitas un cambio? Escríbenos y te responderemos
        aquí mismo.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <NewTicketForm />
        </div>

        <section className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Mis tickets{" "}
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
              ({tickets.length})
            </span>
          </h2>
          {tickets.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Aún no has enviado tickets.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.subject}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {dateFormatter.format(new Date(ticket.created_at))}
                      </p>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                    {ticket.message}
                  </p>
                  {ticket.admin_reply && (
                    <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                        <MessageSquareReply size={14} />
                        Respuesta del equipo
                      </p>
                      <p className="whitespace-pre-wrap">{ticket.admin_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
