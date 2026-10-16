"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/styles/landing.module.css";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#negocios", label: "Para negocios" },
  { href: "#usuarios", label: "Para ti" },
  { href: "#faq", label: "Preguntas frecuentes" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`${styles.bandInner} ${styles.navRow}`}>
        <Link className={styles.brand} href="#top">
          <svg className={styles.brandMark} width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13.5" stroke="url(#headerMark)" strokeWidth={2} />
            <path
              d="M15 7l2.4 5.1 5.6.8-4 4 .9 5.6-4.9-2.7-4.9 2.7.9-5.6-4-4 5.6-.8L15 7z"
              fill="url(#headerMark)"
            />
            <defs>
              <linearGradient id="headerMark" x1="2" y1="2" x2="28" y2="28">
                <stop stopColor="#ffe08a" />
                <stop offset="1" stopColor="#e3a812" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.brandName}>
            Loyalty <em>APP</em>
          </span>
        </Link>

        <nav className={styles.navLinks}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.navCtas}>
          <Link className={styles.btnTextDark} href="/login">
            Iniciar sesión
          </Link>
          <Link className={`${styles.btn} ${styles.btnGhostDark}`} href="/login">
            Registrar mi negocio
          </Link>
          <Link className={`${styles.btn} ${styles.btnGold}`} href="/login?modo=registro">
            Crear mi cuenta
          </Link>
        </div>

        <button
          className={styles.menuBtn}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className={`${styles.mobilePanel} ${open ? styles.open : ""}`}>
        <div className={styles.bandInner}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link
            className={`${styles.btn} ${styles.btnGhostDark}`}
            href="/login"
            onClick={() => setOpen(false)}
            style={{ marginTop: 8 }}
          >
            Registrar mi negocio
          </Link>
          <Link
            className={`${styles.btn} ${styles.btnGold}`}
            href="/login?modo=registro"
            onClick={() => setOpen(false)}
          >
            Crear mi cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}
