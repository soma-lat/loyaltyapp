import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold text-brand-700">Lealtad MVP</h1>
      <p className="max-w-md text-gray-600">
        Recompensa a tus clientes frecuentes. Cada cliente tiene un código QR único;
        el negocio lo escanea para registrar cada compra y otorgar recompensas automáticamente.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
      >
        Iniciar sesión
      </Link>
    </main>
  );
}
