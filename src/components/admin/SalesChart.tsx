"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCOP } from "@/lib/format";
import type { SalesChartPoint } from "@/lib/chart-utils";

// Una sola serie: azul secuencial de la paleta de referencia (validado: pasa
// contraste >= 3:1 sobre el fondo blanco del panel). Sin leyenda: el título
// de la sección ya dice qué se grafica.
const BAR_COLOR = "#2a78d6";
const BAR_HOVER = "#3987e5";
const GRID = "#e4e4e7"; // zinc-200: hairline sólida, discreta
const TICK = "#71717a"; // zinc-500: texto del eje en tinta secundaria

const compact = new Intl.NumberFormat("es-CO", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// "$150 mil", "$1,5 M"
const formatCompactCOP = (value: number) => `$${compact.format(value)}`;

interface SalesChartProps {
  data: SalesChartPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const hasSales = data.some((point) => point.total > 0);

  // Etiqueta directa solo en el pico (nunca un número en cada barra); el resto
  // de valores está en el tooltip y en la tabla.
  const peakIndex = hasSales
    ? data.reduce((best, point, i) => (point.total > data[best].total ? i : best), 0)
    : -1;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {hasSales ? (
        <div
          // En oscuro: barras #3987e5 (validado contra el fondo zinc-900),
          // cuadrícula y franja de hover en grises oscuros.
          className="h-60 w-full dark:[&_.recharts-bar-rectangle_path]:fill-[#3987e5] dark:[&_.recharts-cartesian-axis-line]:stroke-zinc-700 dark:[&_.recharts-cartesian-grid_line]:stroke-zinc-800 dark:[&_.recharts-tooltip-cursor]:fill-zinc-800"
          role="img"
          aria-label={`Gráfico de barras: total por día. Máximo ${formatCOP(
            data[peakIndex].total,
          )} el ${data[peakIndex].fullDate}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: GRID }}
                tick={{ fill: TICK, fontSize: 12 }}
                tickFormatter={(value: string, index: number) =>
                  data[index]?.isToday ? "Hoy" : value
                }
              />
              <YAxis
                width={64}
                tickLine={false}
                axisLine={false}
                tick={{ fill: TICK, fontSize: 12 }}
                tickFormatter={(value: number) => formatCompactCOP(value)}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "#f4f4f5" }}
                content={<SalesTooltip />}
                isAnimationActive={false}
              />
              <Bar
                dataKey="total"
                fill={BAR_COLOR}
                activeBar={{ fill: BAR_HOVER }}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="total"
                  content={(props) => {
                    if (props.index !== peakIndex) return null;
                    const x = Number(props.x) + Number(props.width) / 2;
                    const y = Number(props.y) - 8;
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        className="fill-zinc-700 dark:fill-zinc-200"
                        fontSize={12}
                        fontWeight={600}
                      >
                        {formatCompactCOP(Number(props.value))}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center text-center text-sm text-zinc-500 dark:text-zinc-400">
          Aún no hay pedidos en los últimos 7 días.
        </div>
      )}

      {/* Vista de tabla: los mismos datos sin depender del hover ni del color. */}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer select-none text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100">
          Ver datos en tabla
        </summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="py-1.5 font-semibold">Día</th>
              <th className="py-1.5 text-right font-semibold">Pedidos</th>
              <th className="py-1.5 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((point) => (
              <tr key={point.fullDate}>
                <td className="py-1.5 capitalize text-zinc-700 dark:text-zinc-300">
                  {point.isToday ? `Hoy (${point.fullDate})` : point.fullDate}
                </td>
                <td className="py-1.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {point.orders}
                </td>
                <td className="py-1.5 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatCOP(point.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// Tooltip: el valor manda (grande, alto contraste); la fecha y los pedidos
// van en tinta secundaria.
function SalesTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SalesChartPoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
        {formatCOP(point.total)}
      </p>
      <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
        {point.isToday ? "Hoy" : point.fullDate}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {point.orders} {point.orders === 1 ? "pedido" : "pedidos"}
      </p>
    </div>
  );
}
