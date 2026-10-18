"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, SunMoon } from "lucide-react";
import { isThemeOption, nextThemeOption, THEME_LABELS, type ThemeOption } from "@/lib/theme";

const ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: SunMoon,
};

const noopSubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
}

// Alterna claro -> oscuro -> sistema con el ThemeProvider más cercano (panel,
// SuperAdmin o la vitrina de la tienda, que guarda su propia elección).
export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // El tema guardado solo se conoce en el navegador: hasta montar se muestra
  // un ícono neutro para no causar errores de hidratación.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const actual: ThemeOption = isThemeOption(theme) ? theme : "system";
  // Todo lo renderizado (ícono y textos) usa el mismo valor en servidor e
  // hidratación; el real aparece al montar.
  const current = mounted ? actual : "system";
  const next = nextThemeOption(current);
  const Icon = ICONS[current];

  const handleClick = () => {
    setTheme(nextThemeOption(actual));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Tema: ${THEME_LABELS[current]}. Cambiar a ${THEME_LABELS[next]}`}
      title={`Tema: ${THEME_LABELS[current]}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${className}`}
    >
      <Icon size={20} />
    </button>
  );
}
