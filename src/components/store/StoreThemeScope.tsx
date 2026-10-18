"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { isThemeOption, type ThemeOption } from "@/lib/theme";

// Tema de la vitrina de UNA tienda, independiente del tema global
// (next-themes). Prioridad: elección del comprador en esta tienda >
// default_theme de la tienda > tema global.
//
// - El servidor pinta la clase del default_theme: sin parpadeo ni error de
//   hidratación para quien nunca tocó el botón.
// - La elección del comprador vive en localStorage ("store-theme:<id>") y se
//   lee con useSyncExternalStore: en la hidratación se usa el valor del
//   servidor y justo después el guardado.
// - "system" = sin clase: sigue el tema global (por defecto, el del sistema).

interface StoreThemeContextValue {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

export function useStoreTheme() {
  return useContext(StoreThemeContext);
}

const CHANGE_EVENT = "store-theme-change";

function storageKey(storeId: string) {
  return `store-theme:${storeId}`;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function readStoredTheme(storeId: string): ThemeOption | null {
  try {
    const value = localStorage.getItem(storageKey(storeId));
    return isThemeOption(value) ? value : null;
  } catch {
    return null;
  }
}

interface StoreThemeScopeProps {
  storeId: string;
  defaultTheme: string | null | undefined;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export default function StoreThemeScope({
  storeId,
  defaultTheme,
  className = "",
  style,
  children,
}: StoreThemeScopeProps) {
  const storeDefault: ThemeOption = isThemeOption(defaultTheme) ? defaultTheme : "system";

  const stored = useSyncExternalStore(
    subscribe,
    () => readStoredTheme(storeId),
    () => null,
  );
  const theme = stored ?? storeDefault;

  const setTheme = useCallback(
    (next: ThemeOption) => {
      try {
        localStorage.setItem(storageKey(storeId), next);
      } catch {
        // Modo privado o almacenamiento bloqueado: sin persistencia.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [storeId],
  );

  const themeClass = theme === "system" ? "" : theme;

  return (
    <StoreThemeContext value={{ theme, setTheme }}>
      <div style={style} className={`${className} ${themeClass}`}>
        {children}
      </div>
    </StoreThemeContext>
  );
}
