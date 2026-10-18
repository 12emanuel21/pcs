"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import ThemedToaster from "@/components/ThemedToaster";
import type { ThemeOption } from "@/lib/theme";

interface ThemeProviderProps {
  children: ReactNode;
  // Dónde se guarda la elección del usuario. El panel y el SuperAdmin usan la
  // clave por defecto ("theme"); cada vitrina usa la suya.
  storageKey?: string;
  defaultTheme?: ThemeOption;
}

// next-themes con su comportamiento nativo: pone o quita la clase .dark en
// <html>. Un ThemeProvider anidado no hace nada, por eso no va en el layout
// raíz: cada zona (panel, SuperAdmin, vitrina) monta el suyo.
export function ThemeProvider({
  children,
  storageKey,
  defaultTheme = "system",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
    >
      {children}
      <ThemedToaster />
    </NextThemesProvider>
  );
}
