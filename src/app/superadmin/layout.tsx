import { Suspense } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck, Store as StoreIcon } from "lucide-react";
import { logout } from "@/app/admin/actions";
import SuperAdminTabs from "@/components/superadmin/SuperAdminTabs";
import { getOwnStore, requireSuperAdmin } from "@/lib/auth";

export const metadata = {
  title: "LocalStore SaaS · SuperAdmin",
};

// La sesión se verifica dentro de <Suspense> (requisito de cacheComponents).
// SuperAdminGuard solo deja pasar el contenido si el rol es SUPERADMIN; cada
// página repite la verificación porque Next puede renderizarla en paralelo.
export default function SuperAdminLayout({
  children,
}: LayoutProps<"/superadmin">) {
  return (
    // "light": el SuperAdmin aún no tiene estilos oscuros; esta clase anula el
    // tema oscuro global en toda la sección (ver la variante dark en globals.css).
    <div className="light flex min-h-full flex-1 flex-col bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="font-semibold leading-tight">LocalStore SaaS</p>
              <p className="text-xs text-slate-400">SuperAdmin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              <AdminEmail />
            </Suspense>
            <Suspense fallback={null}>
              <OwnStoreLink />
            </Suspense>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6">
          <SuperAdminTabs />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">
        <Suspense
          fallback={<p className="text-slate-500">Cargando panel maestro...</p>}
        >
          <SuperAdminGuard>{children}</SuperAdminGuard>
        </Suspense>
      </main>
    </div>
  );
}

async function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  return children;
}

async function AdminEmail() {
  const { profile } = await requireSuperAdmin();
  return (
    <span className="hidden text-sm text-slate-400 md:inline">
      {profile.email}
    </span>
  );
}

// Solo si el SuperAdmin también es dueño de una tienda.
async function OwnStoreLink() {
  const store = await getOwnStore();
  if (!store) return null;

  return (
    <Link
      href="/admin"
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
    >
      <StoreIcon size={16} />
      <span className="hidden sm:inline">Mi tienda</span>
    </Link>
  );
}
