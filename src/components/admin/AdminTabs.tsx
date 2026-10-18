"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Package, ReceiptText, Settings, Users } from "lucide-react";

// ownerOnly: ocultas para empleados (STAFF). Las páginas y acciones también
// lo validan en el servidor; ocultarlas es solo para no mostrar callejones.
const TABS = [
  { href: "/admin", label: "Productos", icon: Package, ownerOnly: false },
  { href: "/admin/orders", label: "Pedidos", icon: ReceiptText, ownerOnly: false },
  { href: "/admin/settings", label: "Ajustes", icon: Settings, ownerOnly: true },
  { href: "/admin/staff", label: "Empleados", icon: Users, ownerOnly: true },
  { href: "/admin/support", label: "Soporte", icon: LifeBuoy, ownerOnly: false },
] as const;

export default function AdminTabs({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((tab) => isOwner || !tab.ownerOnly);

  return (
    <>
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </>
  );
}
