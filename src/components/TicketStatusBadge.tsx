import type { TicketStatus } from "@/types";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelto",
};

const STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
};

export default function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {TICKET_STATUS_LABELS[status] ?? status}
    </span>
  );
}
