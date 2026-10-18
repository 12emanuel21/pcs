import { Suspense } from "react";
import { Inbox } from "lucide-react";
import PageSkeleton from "@/components/admin/PageSkeleton";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import ServiceRoleNotice from "@/components/superadmin/ServiceRoleNotice";
import TicketReplyForm from "@/components/superadmin/TicketReplyForm";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SupportTicket, TicketStatus } from "@/types";

type TicketWithStore = SupportTicket & { stores: { name: string } | null };

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

// Pendientes primero; dentro de cada estado, los más recientes arriba.
const STATUS_ORDER: Record<TicketStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
};

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TicketsInbox />
    </Suspense>
  );
}

async function TicketsInbox() {
  await requireSuperAdmin();

  const db = createAdminClient();
  if (!db.supabase) return <ServiceRoleNotice message={db.error} />;

  const { data, error } = await db.supabase
    .from("support_tickets")
    .select("*, stores(name)")
    .order("created_at", { ascending: false })
    .returns<TicketWithStore[]>();

  if (error) throw error;

  const tickets = [...data].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tickets de Soporte</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Solicitudes enviadas por los comerciantes desde su panel.
      </p>

      {tickets.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
          <Inbox size={36} />
          No hay tickets todavía.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{ticket.subject}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {ticket.stores?.name ?? ticket.store_id} ·{" "}
                    <span className="font-mono">/{ticket.store_id}</span> ·{" "}
                    {dateFormatter.format(new Date(ticket.created_at))}
                  </p>
                </div>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {ticket.message}
              </p>
              <TicketReplyForm ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
