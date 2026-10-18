"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import { buildReceiptText } from "@/lib/receipt";
import type { OrderLog } from "@/types";

interface ReceiptModalProps {
  storeName: string;
  order: OrderLog;
  // Nombre que el comerciante está escribiendo (puede no estar guardado aún).
  customerName: string;
  onClose: () => void;
}

// navigator.clipboard solo existe en contextos seguros (https o localhost).
// Si se abre el panel por http desde otra IP (ej. probando en el celular),
// se usa el método antiguo con un textarea temporal.
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continúa con el método alternativo.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}

export default function ReceiptModal({
  storeName,
  order,
  customerName,
  onClose,
}: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const text = buildReceiptText(storeName, {
    ...order,
    customer_name: customerName,
  });

  const handleCopy = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true);
      toast.success("Recibo copiado. Pégalo en el chat de WhatsApp del cliente.");
    } else {
      toast.error("No se pudo copiar. Selecciona el texto y cópialo manualmente.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-left"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2
            id="receipt-title"
            className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            <ReceiptText size={20} />
            Recibo para WhatsApp
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {order.status !== "PAID" && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            Este pedido aún no está marcado como Pagado. El recibo dice
            &quot;Total Pagado&quot;.
          </p>
        )}

        <pre className="mt-4 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-sans text-sm leading-relaxed text-zinc-800 select-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {text}
        </pre>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-green-700"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
          {copied ? "¡Copiado!" : "Copiar texto"}
        </button>
      </div>
    </div>
  );
}
