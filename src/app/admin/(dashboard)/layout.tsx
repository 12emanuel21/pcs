import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { stopImpersonation } from "@/app/superadmin/actions";
import AdminTabs from "@/components/admin/AdminTabs";
import ThemeToggle from "@/components/ThemeToggle";
import { getCurrentStore, getUserProfile } from "@/lib/auth";
import { getDaysUntilExpiration, isStoreActive } from "@/lib/store-utils";
import { SUPERADMIN_ROLE, type Store } from "@/types";

// Vive en el route group (dashboard) para no envolver /admin/login,
// lo que causaría un bucle de redirecciones.
//
// La protección principal está en src/proxy.ts (redirige antes de renderizar).
// Aquí se verifica de nuevo dentro de <Suspense>: con cacheComponents, leer
// cookies fuera de un boundary rompe el build.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:[color-scheme:dark] dark:bg-zinc-950">
      <Suspense fallback={null}>
        <StoreBanners />
      </Suspense>
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Panel de tienda</span>
          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <SuperAdminLink />
            </Suspense>
            <Suspense fallback={null}>
              <UserEmail />
            </Suspense>
            <ThemeToggle className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" />
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-6">
          {/* Mientras se resuelve el rol se muestran solo las pestañas comunes. */}
          <Suspense fallback={<AdminTabs isOwner={false} />}>
            <TabsForRole />
          </Suspense>
          <Suspense fallback={null}>
            <ViewStoreLink />
          </Suspense>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <Suspense
          fallback={<p className="text-zinc-500 dark:text-zinc-400">Cargando panel...</p>}
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}

// Barra de Modo Soporte (SuperAdmin administrando una tienda ajena) y aviso
// de tienda suspendida por pago.
async function StoreBanners() {
  const { store, isImpersonating } = await getCurrentStore();

  return (
    <>
      {isImpersonating && store && (
        <div className="bg-amber-400 text-amber-950">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Wrench size={16} />
              Modo Soporte: Administrando {store.name}
              <span className="font-mono text-xs opacity-70">/{store.id}</span>
            </span>
            <form action={stopImpersonation}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-900"
              >
                <ArrowLeft size={14} />
                Salir y volver a SuperAdmin
              </button>
            </form>
          </div>
        </div>
      )}
      {store && !isStoreActive(store) && (
        <div className="bg-red-600 text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-2.5 text-sm font-medium">
            <AlertTriangle size={16} className="shrink-0" />
            Tu suscripción está vencida o la tienda está pausada. Contacta al
            administrador.
          </div>
        </div>
      )}
      {store && isStoreActive(store) && <ExpirationWarning store={store} />}
    </>
  );
}

const WARNING_DAYS = 5;

function ExpirationWarning({ store }: { store: Store }) {
  const days = getDaysUntilExpiration(store);
  if (days === null || days < 0 || days > WARNING_DAYS) return null;

  const when =
    days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`;

  return (
    <div className="bg-yellow-300 text-yellow-950">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-2.5 text-sm font-medium">
        <Clock size={16} className="shrink-0" />
        Tu suscripción vence {when}. Renueva pronto para evitar
        interrupciones.
      </div>
    </div>
  );
}

async function TabsForRole() {
  const { accessLevel } = await getCurrentStore();
  return <AdminTabs isOwner={accessLevel !== "STAFF"} />;
}

async function UserEmail() {
  const { user, accessLevel } = await getCurrentStore();
  return (
    <span className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex dark:text-zinc-400">
      {accessLevel === "STAFF" && (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Empleado
        </span>
      )}
      {user.email}
    </span>
  );
}

async function SuperAdminLink() {
  const profile = await getUserProfile();
  if (profile?.global_role !== SUPERADMIN_ROLE) return null;

  return (
    <Link
      href="/superadmin"
      className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
    >
      <ShieldCheck size={16} />
      <span className="hidden sm:inline">Control Maestro</span>
    </Link>
  );
}

async function ViewStoreLink() {
  const { store } = await getCurrentStore();
  if (!store) return null;

  return (
    <a
      href={`/${store.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-auto flex shrink-0 items-center gap-1.5 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      Ver mi Tienda
      <ExternalLink size={14} />
    </a>
  );
}
