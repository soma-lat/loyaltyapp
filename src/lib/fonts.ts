import localFont from "next/font/local";

/**
 * Self-hosted fonts (next/font/local) instead of next/font/google.
 *
 * next/font/google downloads font files from Google Fonts at BUILD time.
 * When that network call fails (as it did on Vercel: "Failed to download
 * `Nunito` from Google Fonts"), `next build` fails hard, unlike `next dev`
 * which just falls back silently. Self-hosting removes that network
 * dependency entirely, so the build can never fail this way again.
 *
 * Nunito ships as a variable font on Google Fonts: a single physical file
 * covers the whole 400-900 weight range, so one file is declared at each
 * discrete weight below to match the original next/font/google config.
 */

// next/font's compiler plugin requires the `localFont()` argument to be a
// literal written inline at each call site — it cannot reference a shared
// variable — so the same six-weight `src` array is repeated below for the
// app panels and for the landing page.

// Used by the authenticated panels (portal/admin layouts); feeds the
// `font-nunito` Tailwind utility via the --font-nunito CSS variable.
export const nunitoApp = localFont({
  src: [
    { path: "../fonts/nunito-variable.woff2", weight: "400", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "500", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "600", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "700", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "800", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});

// Used by the public landing page, which keeps its own CSS-variable
// namespace (--next-nunito / --next-plex-mono) isolated from the Tailwind
// based panels.
export const nunitoLanding = localFont({
  src: [
    { path: "../fonts/nunito-variable.woff2", weight: "400", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "500", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "600", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "700", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "800", style: "normal" },
    { path: "../fonts/nunito-variable.woff2", weight: "900", style: "normal" },
  ],
  variable: "--next-nunito",
  display: "swap",
});

export const plexMonoLanding = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--next-plex-mono",
  display: "swap",
});
