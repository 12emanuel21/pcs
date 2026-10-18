import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Store } from "@/types";

interface StoreFooterProps {
  store: Pick<Store, "name" | "whatsapp_number">;
}

// Pie de la vitrina: nombre de la tienda, contacto directo por WhatsApp y
// la firma de la plataforma. El padding inferior deja libre el botón
// flotante del carrito (56px + margen + área segura del iPhone).
export default function StoreFooter({ store }: StoreFooterProps) {
  // wa.me solo acepta dígitos; sin número válido no se muestra el botón.
  const phone = store.whatsapp_number?.replace(/\D/g, "") ?? "";

  return (
    <footer className="border-t border-zinc-200/70 px-4 pt-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-center dark:border-zinc-800/80">
      <p className="text-lg font-semibold tracking-tight text-balance text-zinc-900 dark:text-white">
        {store.name}
      </p>
      {phone && (
        <a
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-[15px] font-semibold text-[#0B3D1E] transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
        >
          <MessageCircle size={18} />
          Escribir por WhatsApp
        </a>
      )}
      <p className="mt-8 text-[13px] text-zinc-500 dark:text-zinc-400">
        Hecho con{" "}
        <Link
          href="/"
          className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          LocalStore
        </Link>
      </p>
    </footer>
  );
}
