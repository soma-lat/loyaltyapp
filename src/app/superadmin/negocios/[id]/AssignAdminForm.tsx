"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignAdminForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/superadmin/assign-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, businessId }),
    });
    const body = await res.json();

    setSaving(false);
    if (!res.ok) {
      setMessage(body.error ?? "Error al asignar administrador");
      return;
    }
    setMessage("Administrador invitado/asignado correctamente.");
    setEmail("");
    setFullName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-700">Asignar administrador</h3>
      <input
        type="email"
        required
        placeholder="correo@negocio.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        placeholder="Nombre (opcional)"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Enviando..." : "Invitar / Asignar"}
      </button>
      <p className="text-xs text-gray-400">
        Si el correo no tiene cuenta, se le enviará invitación por correo (requiere SMTP configurado en Supabase).
      </p>
    </form>
  );
}
