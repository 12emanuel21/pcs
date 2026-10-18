import type { ReactNode } from "react";

interface StatusScreenProps {
  // Logo de la tienda o un ícono dentro de un recuadro.
  visual: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

// Pantalla centrada para estados de la vitrina: tienda inexistente, error de
// carga y tienda fuera de servicio. Sin marca propia: neutra en claro y oscuro.
export default function StatusScreen({
  visual,
  title,
  description,
  action,
}: StatusScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-center text-zinc-900 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]">
      <div className="flex w-full max-w-sm flex-col items-center">
        {visual}
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[15px] leading-relaxed text-pretty text-zinc-500 dark:text-slate-400">
            {description}
          </p>
        )}
        {action && <div className="mt-8 w-full sm:w-auto">{action}</div>}
      </div>
    </main>
  );
}

// Recuadro suave para el ícono de una pantalla de estado.
export function StatusIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-200/70 text-zinc-500 dark:bg-slate-800 dark:text-slate-400">
      {children}
    </span>
  );
}
