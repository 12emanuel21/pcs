import { Suspense } from "react";
import PageSkeleton from "@/components/admin/PageSkeleton";
import { Lock, Store as StoreIcon } from "lucide-react";
import StoreQrCard from "@/components/admin/StoreQrCard";
import StoreSettingsForm from "@/components/admin/StoreSettingsForm";
import { getCurrentStore } from "@/lib/auth";

// El <Suspense> va aquí y no solo en el layout: en una navegación entre
// pestañas el layout no se re-renderiza y su boundary no cubre esta página.
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const { store, accessLevel } = await getCurrentStore();

  if (store && accessLevel === "STAFF") {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Lock className="mx-auto text-zinc-400 dark:text-zinc-500" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Acceso denegado
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Solo el dueño de la tienda puede cambiar los ajustes.
        </p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <StoreIcon className="mx-auto text-zinc-400 dark:text-zinc-500" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Aún no tienes una tienda asignada
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Contacta a soporte para que configuremos tu tienda.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Ajustes de Tienda</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Personaliza cómo ven tu tienda tus clientes.
      </p>
      <div className="mt-6 flex flex-col gap-6">
        <StoreSettingsForm store={store} />
        <StoreQrCard storeId={store.id} storeName={store.name} />
      </div>
    </div>
  );
}
