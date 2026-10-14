"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function NavBar({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-8">
        <span className="font-semibold text-brand-700">{title}</span>
        <nav className="flex gap-4 text-sm text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-600">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
        Cerrar sesión
      </button>
    </header>
  );
}
