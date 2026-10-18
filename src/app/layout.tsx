import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LocalStore",
  description: "Catálogos digitales para tiendas locales, con pedidos por WhatsApp.",
};

// viewportFit "cover": la página ocupa toda la pantalla del iPhone y
// env(safe-area-inset-*) deja de valer 0, así el carrito y el botón flotante
// respetan la barra de inicio.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes pone la clase del tema en <html>
    // antes de hidratar (es lo esperado, no un error). El ThemeProvider vive
    // en cada zona (admin, superadmin, vitrina), no aquí.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
