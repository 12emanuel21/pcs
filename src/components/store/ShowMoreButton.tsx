"use client";

import { ChevronDown } from "lucide-react";

interface ShowMoreButtonProps {
  // Productos que faltan por mostrar (0 = no se muestra el botón).
  remaining: number;
  onClick: () => void;
  className?: string;
}

// "Ver más" al final de la grilla: revela la siguiente página del catálogo.
export default function ShowMoreButton({ remaining, onClick, className = "" }: ShowMoreButtonProps) {
  if (remaining <= 0) return null;
  return (
    <div className={`flex justify-center ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Ver más
        <span className="font-normal text-zinc-500 dark:text-zinc-400">({remaining})</span>
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
