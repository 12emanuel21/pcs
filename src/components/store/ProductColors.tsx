import { productColors } from "@/lib/colors";

const MAX_VISIBLE = 6;

// Fila de círculos con los colores disponibles de un producto. No muestra
// nada si no tiene colores. Más de MAX_VISIBLE se resumen en "+N".
export default function ProductColors({
  colors,
  className = "",
}: {
  colors: unknown;
  className?: string;
}) {
  const list = productColors(colors);
  if (list.length === 0) return null;

  const visible = list.slice(0, MAX_VISIBLE);
  const hidden = list.length - visible.length;

  return (
    <div
      role="img"
      aria-label={`${list.length} ${list.length === 1 ? "color disponible" : "colores disponibles"}`}
      className={`flex items-center gap-1 ${className}`}
    >
      {visible.map((color) => (
        <span
          key={color}
          title={color}
          style={{ backgroundColor: color }}
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15 shadow-sm dark:border-white/25"
        />
      ))}
      {hidden > 0 && (
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">+{hidden}</span>
      )}
    </div>
  );
}
