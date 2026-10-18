"use client";

import type { ComponentProps } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Tema global (clase en <html>). El modo claro usa la clase "theme-light"
// (no "light"): la clase "light" queda reservada para que la vitrina de una
// tienda pueda forzar claro en su contenedor (ver globals.css).
export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider value={{ light: "theme-light", dark: "dark" }} {...props} />
  );
}
