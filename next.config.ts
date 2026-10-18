import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo en desarrollo: deja que el celular (u otro equipo de la misma red
  // WiFi) cargue el servidor de desarrollo por la IP local del PC, por ej.
  // http://192.168.1.50:3000. Sin esto, Next bloquea los recursos de
  // desarrollo (JS, recarga en caliente) para orígenes distintos de localhost.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    agentFeedback: true,
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
