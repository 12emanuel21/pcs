"use client";

import { useRef, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";
import { AlertTriangle, Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

interface StoreQrCardProps {
  storeId: string;
  storeName: string;
}

const EXPORT_SIZE = 1024; // px del PNG descargado (nítido para imprimir)
const EXPORT_MARGIN = 96;
const EXPORT_CAPTION = 120;

// Dominio público: NEXT_PUBLIC_SITE_URL si está configurado (producción); si
// no, el origen desde el que se abrió el panel.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? null;

const subscribe = () => () => {};

function useOrigin(): string | null {
  // null en el servidor: el origen solo se conoce en el navegador.
  return useSyncExternalStore(
    subscribe,
    () => SITE_URL ?? window.location.origin,
    () => SITE_URL,
  );
}

function slugifyFileName(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tienda"
  );
}

export default function StoreQrCard({ storeId, storeName }: StoreQrCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const origin = useOrigin();
  const url = origin ? `${origin}/${storeId}` : null;
  const isLocal = origin
    ? /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|$)/.test(origin)
    : false;

  // Dibuja el SVG del QR en un canvas con margen blanco y el nombre de la
  // tienda debajo, y lo descarga como PNG.
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !url) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(
      new Blob([svgData], { type: "image/svg+xml;charset=utf-8" }),
    );
    const image = new Image();

    image.onload = () => {
      const qrSize = EXPORT_SIZE - EXPORT_MARGIN * 2;
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE + EXPORT_CAPTION;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, EXPORT_MARGIN, EXPORT_MARGIN, qrSize, qrSize);

      ctx.fillStyle = "#18181B";
      ctx.textAlign = "center";
      ctx.font = "bold 52px system-ui, sans-serif";
      ctx.fillText(storeName, EXPORT_SIZE / 2, EXPORT_SIZE + 10, EXPORT_SIZE - 80);
      ctx.fillStyle = "#71717A";
      ctx.font = "32px system-ui, sans-serif";
      ctx.fillText(
        "Escanea para ver el catálogo",
        EXPORT_SIZE / 2,
        EXPORT_SIZE + 64,
        EXPORT_SIZE - 80,
      );

      URL.revokeObjectURL(svgUrl);
      const link = document.createElement("a");
      link.download = `qr-${slugifyFileName(storeName)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      toast.error("No se pudo generar la imagen del QR.");
    };
    image.src = svgUrl;
  };

  const handleCopyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        <QrCode size={20} />
        Código QR de tu Tienda
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Imprímelo y ponlo en tu local: tus clientes lo escanean y ven el
        catálogo en su celular.
      </p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div
          ref={qrRef}
          className="shrink-0 rounded-xl border border-zinc-200 bg-white p-4"
        >
          {url ? (
            <QRCode value={url} size={176} level="M" />
          ) : (
            <div className="h-44 w-44 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          )}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3">
          <p className="break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            {url ?? "Cargando enlace..."}
          </p>

          {isLocal && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Este QR apunta a {origin}, que solo funciona en este computador.
              En producción configura NEXT_PUBLIC_SITE_URL con tu dominio.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!url}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Download size={16} />
              Descargar PNG
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!url}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Copy size={16} />
              Copiar enlace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
