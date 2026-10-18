"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Business } from "@/lib/types";

const FIELDS: { key: keyof Business; label: string; placeholder?: string }[] = [
  { key: "name", label: "Nombre del negocio" },
  { key: "logo_url", label: "URL del logotipo", placeholder: "https://..." },
  { key: "description", label: "Descripción" },
  { key: "address", label: "Ubicación" },
  { key: "contact_phone", label: "Teléfono de contacto" },
  { key: "contact_email", label: "Correo de contacto" },
];

export function PerfilView({ business }: { business: Business }) {
  const supabase = createClient();
  const [values, setValues] = useState({
    name: business.name,
    logo_url: business.logo_url ?? "",
    description: business.description ?? "",
    address: business.address ?? "",
    contact_phone: business.contact_phone ?? "",
    contact_email: business.contact_email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("businesses")
      .update({
        name: values.name,
        logo_url: values.logo_url || null,
        description: values.description || null,
        address: values.address || null,
        contact_phone: values.contact_phone || null,
        contact_email: values.contact_email || null,
      })
      .eq("id", business.id);

    setMessage(error ? error.message : "Perfil actualizado.");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-3xl border border-bordercolor bg-white p-6">
      {values.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={values.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
      )}

      {FIELDS.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-1">
          <label className="text-sm font-bold text-primary">{label}</label>
          <input
            value={values[key as keyof typeof values]}
            placeholder={placeholder}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
      ))}

      {message && <p className="text-sm text-muted">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
