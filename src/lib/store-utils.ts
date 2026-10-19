import type { Store } from "@/types";

// Las suscripciones se manejan en hora de Colombia (UTC-5, sin horario de
// verano). Una fecha de vencimiento "2026-10-20" significa que la tienda
// funciona todo ese día y se corta al terminar el día en Bogotá.
const TIME_ZONE = "America/Bogota";
const UTC_OFFSET = "-05:00";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// en-CA formatea como YYYY-MM-DD.
const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const displayFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type SubscriptionFields = Pick<Store, "is_active" | "subscription_end">;

export function isValidDateString(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Fecha de vencimiento (YYYY-MM-DD, calendario de Bogotá) o null si es
// ilimitada. Acepta columnas tipo date ("2026-10-20") o timestamptz.
export function getSubscriptionEndDate(store: SubscriptionFields): string | null {
  const value = store.subscription_end;
  if (!value) return null;
  if (DATE_ONLY.test(value)) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : isoDateFormatter.format(date);
}

// Valor a guardar en subscription_end: el final del día en Bogotá. Si la
// columna es date, Postgres conserva solo la fecha; si es timestamptz, el
// instante exacto.
export function toSubscriptionEnd(date: string): string {
  return `${date}T23:59:59.999${UTC_OFFSET}`;
}

// Activa si y solo si no está pausada manualmente y no ha vencido.
export function isStoreActive(store: SubscriptionFields, now = new Date()): boolean {
  if (store.is_active === false) return false;

  const endDate = getSubscriptionEndDate(store);
  if (!endDate) return true;

  return now.getTime() <= new Date(toSubscriptionEnd(endDate)).getTime();
}

// Días de calendario (Bogotá) hasta el vencimiento: 0 = vence hoy,
// negativo = vencida. null si la suscripción es ilimitada.
export function getDaysUntilExpiration(
  store: SubscriptionFields,
  now = new Date(),
): number | null {
  const endDate = getSubscriptionEndDate(store);
  if (!endDate) return null;

  const today = getTodayDate(now);
  const diff =
    new Date(`${endDate}T00:00:00Z`).getTime() -
    new Date(`${today}T00:00:00Z`).getTime();
  return Math.round(diff / MS_PER_DAY);
}

// Fecha de hoy (YYYY-MM-DD) en el calendario de Bogotá.
export function getTodayDate(now = new Date()): string {
  return isoDateFormatter.format(now);
}

// Suma días de calendario a una fecha YYYY-MM-DD (sin depender de la zona
// horaria del servidor: se opera en UTC sobre la fecha pura).
export function addDaysToDate(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// "20 oct 2026" para mostrar en tablas.
export function formatSubscriptionDate(date: string): string {
  return displayFormatter.format(new Date(`${date}T00:00:00Z`));
}
