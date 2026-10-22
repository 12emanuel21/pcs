import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo en desarrollo: deja que el celular (u otro equipo de la misma red
  // WiFi) cargue el servidor de desarrollo por la IP local del PC, por ej.
  // http://192.168.1.50:3000. Sin esto, Next bloquea los recursos de
  // desarrollo (JS, recarga en caliente) para orígenes distintos de localhost.
  // test-n8n.autobotsdev.dev: dominio público que apunta al puerto 5678 de
  // este PC (ver `npm run dev:public` y BITACORA.md).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "test-n8n.autobotsdev.dev"],
  // Solo en desarrollo: los JS y CSS de /_next/static conservan la misma URL
  // aunque cambie su contenido, y Cloudflare (dominio público) los guardaba 4
  // horas en el navegador. Eso mezclaba código viejo del cliente con HTML
  // nuevo del servidor (errores de hidratación, estilos faltantes; ver
  // BITACORA.md). no-store para el navegador y para la caché de Cloudflare.
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];
    const noStore = "no-store";
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: noStore },
          { key: "CDN-Cache-Control", value: noStore },
          { key: "Cloudflare-CDN-Cache-Control", value: noStore },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
