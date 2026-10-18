"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_TABS, isAdminTabActive } from "@/components/AdminBottomNav";
import { QrIcon, LogoutIcon } from "@/components/icons";
import type { Role } from "@/lib/types";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function AdminHeader({
  businessName,
  displayName,
  role,
}: {
  businessName: string;
  displayName: string;
  role: Role;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const canSeeProfile = role === "business_admin";
  const isScanning = pathname.startsWith("/admin/scan");
  const isPerfil = pathname.startsWith("/admin/perfil");
  const isSeguridad = pathname.startsWith("/admin/seguridad");
  const title = isScanning
    ? "Escanear"
    : isPerfil
    ? "Perfil del negocio"
    : isSeguridad
    ? "Seguridad"
    : ADMIN_TABS.find((t) => isAdminTabActive(pathname, t.href))?.label ?? "Inicio";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-bordercolor bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          {canSeeProfile ? (
            <Link
              href="/admin/perfil"
              className="block truncate text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
            >
              {businessName}
            </Link>
          ) : (
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-accent">{businessName}</p>
          )}
          <h1 className="truncate text-xl font-extrabold text-primary">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/scan"
            aria-label="Escanear"
            className={`flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
              isScanning ? "bg-primary text-white" : "bg-accent text-white hover:opacity-90"
            }`}
          >
            <QrIcon className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
          <span
            title={displayName}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
          >
            <span aria-hidden="true">{getInitials(displayName)}</span>
            <span className="sr-only">{displayName}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
