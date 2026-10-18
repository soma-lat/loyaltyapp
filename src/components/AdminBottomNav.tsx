"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { HomeIcon, UsersIcon, ListIcon, ChartIcon, SettingsIcon } from "@/components/icons";
import type { Role } from "@/lib/types";

export const ADMIN_TABS: {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  employeeVisible?: boolean;
}[] = [
  { href: "/admin", label: "Inicio", icon: HomeIcon, employeeVisible: true },
  { href: "/admin/clientes", label: "Clientes", icon: UsersIcon, employeeVisible: true },
  { href: "/admin/compras", label: "Compras", icon: ListIcon },
  { href: "/admin/informes", label: "Informes", icon: ChartIcon },
  { href: "/admin/promociones", label: "Promociones", icon: SettingsIcon },
];

export function isAdminTabActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = role === "employee" ? ADMIN_TABS.filter((t) => t.employeeVisible) : ADMIN_TABS;

  return (
    <nav
      aria-label="Secciones del panel de negocio"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-bordercolor bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isAdminTabActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  active ? "text-accent" : "text-muted hover:text-primary"
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
