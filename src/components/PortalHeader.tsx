"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PORTAL_TABS, isTabActive } from "@/components/BottomNav";
import { LogoutIcon } from "@/components/icons";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function PortalHeader({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const title = PORTAL_TABS.find((t) => isTabActive(pathname, t.href))?.label ?? "Mi Lealtad";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-bordercolor bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Mi Lealtad</p>
          <h1 className="truncate text-xl font-extrabold text-primary">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
