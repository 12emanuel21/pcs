"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Store } from "lucide-react";

const TABS = [
  { href: "/superadmin", label: "Tiendas y Clientes", icon: Store },
  { href: "/superadmin/tickets", label: "Tickets de Soporte", icon: LifeBuoy },
] as const;

export default function SuperAdminTabs() {
  const pathname = usePathname();

  return (
    <>
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-indigo-400 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
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
