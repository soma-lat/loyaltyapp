"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { LoyaltyProgram } from "@/lib/types";

export default function ProgramaPage() {
  const supabase = createClient();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [purchasesRequired, setPurchasesRequired] = useState(6);
  const [rewardDescription, setRewardDescription] = useState("Producto gratis");
  const [name, setName] = useState("Programa de lealtad");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) {
        setLoading(false);
        return;
      }
      setBusinessId(profile.business_id);

      const { data: existing } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("business_id", profile.business_id)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setProgram(existing);
        setName(existing.name);
        setPurchasesRequired(existing.purchases_required);
        setRewardDescription(existing.reward_description);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setMessage(null);

    if (program) {
      const { error } = await supabase
        .from("loyalty_programs")
        .update({ name, purchases_required: purchasesRequired, reward_description: rewardDescription })
        .eq("id", program.id);
      if (error) setMessage(error.message);
      else setMessage("Programa actualizado.");
    } else {
      const { data, error } = await supabase
        .from("loyalty_programs")
        .insert({
          business_id: businessId,
          name,
          purchases_required: purchasesRequired,
          reward_description: rewardDescription,
          active: true,
        })
        .select()
        .single();
      if (error) setMessage(error.message);
      else {
        setProgram(data);
        setMessage("Programa creado.");
      }
    }
    setSaving(false);
  }

  if (loading) return <p className="px-6 py-10 text-sm text-gray-500">Cargando...</p>;

  return (
    <div className="mx-auto max-w-md space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Programa de lealtad</h1>
        <Link href="/admin" className="text-sm text-brand-600 hover:underline">
          Volver
        </Link>
      </div>

      {!businessId ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Tu cuenta no tiene un negocio asignado todavía.
        </p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre del programa</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Compras necesarias</label>
            <input
              type="number"
              min={1}
              value={purchasesRequired}
              onChange={(e) => setPurchasesRequired(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Recompensa</label>
            <input
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="Ej. Pan gratis"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {message && <p className="text-sm text-gray-600">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : program ? "Guardar cambios" : "Crear programa"}
          </button>
        </form>
      )}
    </div>
  );
}
