import { Store as StoreIcon } from "lucide-react";

// Aviso para un usuario del panel que todavía no tiene tienda asignada.
export default function NoStoreNotice() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <StoreIcon className="mx-auto text-zinc-400 dark:text-zinc-500" size={40} />
      <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Aún no tienes una tienda asignada
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Contacta a soporte para que configuremos tu tienda y puedas empezar a
        vender.
      </p>
    </div>
  );
}
