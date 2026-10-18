const copFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

// Formato fijo "$150.000" para que servidor y cliente rendericen lo mismo.
export function formatCOP(value: number): string {
  return `$${copFormatter.format(value)}`;
}
