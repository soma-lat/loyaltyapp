import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loyalty APP | Programa de lealtad y recompensas para negocios",
  description:
    "Fideliza clientes sin tarjetas físicas: un QR por cliente, sellos por cada compra y recompensas automáticas. Ideal para cafeterías, restaurantes, barberías y salones de belleza.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loyalty APP",
  },
  openGraph: {
    title: "Loyalty APP | Programa de lealtad y recompensas para negocios",
    description:
      "Fideliza clientes sin tarjetas físicas: un QR por cliente, sellos por cada compra y recompensas automáticas.",
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f58d6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
