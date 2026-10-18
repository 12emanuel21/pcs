"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, SunMoon } from "lucide-react";
import { useStoreTheme } from "@/components/store/StoreThemeScope";
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

// Alterna claro -> oscuro -> sistema. Dentro de una vitrina (StoreThemeScope)
// cambia solo el tema de esa tienda; fuera, el tema global de next-themes.
export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const storeTheme = useStoreTheme();
  const global = useTheme();
  // El tema guardado solo se conoce en el navegador: hasta montar se muestra
  // un ícono neutro para no causar errores de hidratación.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const actual: ThemeOption = storeTheme
    ? storeTheme.theme
    : isThemeOption(global.theme)
      ? global.theme
      : "system";
  // Todo lo renderizado (ícono y textos) usa el mismo valor en servidor e
  // hidratación; el real aparece al montar.
  const current = mounted ? actual : "system";
  const next = nextThemeOption(current);
  const Icon = ICONS[current];

  const handleClick = () => {
    const target = nextThemeOption(actual);
    if (storeTheme) storeTheme.setTheme(target);
    else global.setTheme(target);
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
