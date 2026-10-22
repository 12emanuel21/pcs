"use client";

import { useState } from "react";
import { FileSpreadsheet, Sparkles } from "lucide-react";

type Mode = "classic" | "magic";

const MODES: { id: Mode; label: string; icon: typeof Sparkles }[] = [
  { id: "classic", label: "Importación Clásica (Plantilla)", icon: FileSpreadsheet },
  { id: "magic", label: "Importación Mágica con IA", icon: Sparkles },
];

// Pestañas de la página de importación. Las dos zonas quedan montadas (solo
// se oculta la inactiva) para no perder lo que se haya cargado al cambiar.
export default function ImportModes({
  classic,
  magic,
}: {
  classic: React.ReactNode;
  magic: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("classic");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Tipo de importación"
        className="grid gap-1 rounded-xl bg-zinc-100 p-1 sm:grid-cols-2 dark:bg-zinc-800"
      >
        {MODES.map(({ id, label, icon: Icon }) => {
          const isActive = id === mode;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`import-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`import-panel-${id}`}
              onClick={() => setMode(id)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm transition-all duration-200 ${
                isActive
                  ? "bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <Icon size={16} className={id === "magic" && isActive ? "text-violet-500" : ""} />
              {label}
            </button>
          );
        })}
      </div>

      {MODES.map(({ id }) => (
        <div
          key={id}
          role="tabpanel"
          id={`import-panel-${id}`}
          aria-labelledby={`import-tab-${id}`}
          hidden={id !== mode}
          className="mt-6"
        >
          {id === "classic" ? classic : magic}
        </div>
      ))}
    </div>
  );
}
