import { ThemeProvider } from "@/components/ThemeProvider";

// Tema del panel (incluye /admin/login): clase .dark en <html> según la
// elección guardada en "theme" o el sistema.
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
