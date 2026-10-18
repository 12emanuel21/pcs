"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

// Toasts con el tema del ThemeProvider que los contiene (claro/oscuro/sistema).
export default function ThemedToaster() {
  const { theme } = useTheme();
  const toasterTheme = theme === "light" || theme === "dark" ? theme : "system";

  return <Toaster position="top-center" richColors theme={toasterTheme} />;
}
