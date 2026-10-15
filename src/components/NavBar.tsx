"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="truncate font-semibold text-brand-700">{title}</span>

        <nav className="hidden items-center gap-6 md:flex">
          <div className="flex gap-4 text-sm text-gray-600">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-brand-600">
                {l.label}
              </Link>
            ))}
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
            Cerrar sesión
          </button>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="space-y-1 border-t border-gray-200 px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}
