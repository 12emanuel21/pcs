import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import type { OrderLog } from "@/types";

export interface SalesChartPoint {
  date: string; // día corto para el eje X: "Lun", "Mar", "Mié"...
  fullDate: string; // para el tooltip y la tabla: "lunes, 13 de octubre"
  total: number;
  orders: number;
  isToday: boolean;
}

// Los días se cuentan en hora de Colombia: un pedido de las 9 p. m. del lunes
// es del lunes, aunque en UTC (hora del servidor) ya sea martes.
const bogotaDayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Suma el total por día de los últimos `days` días (hoy incluido), excluyendo
// pedidos CANCELLED. Los días sin pedidos quedan en 0.
export function getSalesDataForChart(
  orderLogs: Pick<OrderLog, "total" | "status" | "created_at">[],
  now = new Date(),
  days = 7,
): SalesChartPoint[] {
  // Mediodía UTC del día de hoy en Bogotá: restar días desde ahí nunca cruza
  // de fecha por zona horaria, sin importar dónde corra el servidor.
  const today = new Date(`${bogotaDayKey.format(now)}T12:00:00Z`);

  const points = new Map<string, SalesChartPoint>();
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = subDays(today, offset);
    points.set(day.toISOString().slice(0, 10), {
      date: capitalize(format(day, "EEE", { locale: es }).replace(".", "")),
      fullDate: format(day, "EEEE, d 'de' MMMM", { locale: es }),
      total: 0,
      orders: 0,
      isToday: offset === 0,
    });
  }

  for (const log of orderLogs) {
    if (log.status === "CANCELLED" || !log.created_at) continue;
    const point = points.get(bogotaDayKey.format(new Date(log.created_at)));
    if (!point) continue;
    point.total += Number(log.total) || 0;
    point.orders += 1;
  }

  return [...points.values()];
}
