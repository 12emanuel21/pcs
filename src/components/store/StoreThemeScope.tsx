import type { CSSProperties, ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { isThemeOption } from "@/lib/theme";

interface StoreThemeScopeProps {
  storeId: string;
  defaultTheme: string | null | undefined;
  // Tema fijo para toda la vitrina (plantilla gamer: "dark"). Con él,
  // <html> y <body> quedan en ese tema aunque el comprador haya elegido
  // otro antes.
  forcedTheme?: "light" | "dark";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// Tema de la vitrina de una tienda: un ThemeProvider propio con
// - defaultTheme = default_theme de la tienda (lo que ve quien entra por
//   primera vez), y
// - una clave de almacenamiento por tienda, así la elección del comprador en
//   esta vitrina no cambia el tema del panel ni el de otras tiendas.
// El script de next-themes aplica la clase antes de pintar: sin parpadeo ni
// errores de hidratación.
export default function StoreThemeScope({
  storeId,
  defaultTheme,
  forcedTheme,
  className = "",
  style,
  children,
}: StoreThemeScopeProps) {
  return (
    <ThemeProvider
      storageKey={`store-theme:${storeId}`}
      defaultTheme={isThemeOption(defaultTheme) ? defaultTheme : "system"}
      forcedTheme={forcedTheme}
    >
      <div style={style} className={className}>
        {children}
      </div>
    </ThemeProvider>
  );
}

// Para pantallas de la vitrina sin tienda conocida (cargando, no encontrada,
// error): siguen el tema del celular. Nadie escribe en esta clave, así que
// siempre resuelve a "system".
export function SystemThemeScope({ children }: { children: ReactNode }) {
  return <ThemeProvider storageKey="store-theme:system">{children}</ThemeProvider>;
}
