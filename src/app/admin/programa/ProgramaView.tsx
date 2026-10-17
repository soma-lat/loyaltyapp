"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LoyaltyProgram } from "@/lib/types";

export function ProgramaView({
  businessId,
  initialProgram,
}: {
  businessId: string;
  initialProgram: LoyaltyProgram | null;
}) {
  const supabase = createClient();
  const [program, setProgram] = useState<LoyaltyProgram | null>(initialProgram);
  const [name, setName] = useState(initialProgram?.name ?? "Programa de lealtad");
  const [purchasesRequired, setPurchasesRequired] = useState(initialProgram?.purchases_required ?? 6);
  const [rewardDescription, setRewardDescription] = useState(
    initialProgram?.reward_description ?? "Producto gratis"
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-4 rounded-3xl border border-bordercolor bg-white p-6">
        <div className="space-y-1">
          <label className="text-sm font-bold text-primary">Nombre del programa</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-primary">Compras necesarias</label>
          <input
            type="number"
            min={1}
            value={purchasesRequired}
            onChange={(e) => setPurchasesRequired(Number(e.target.value))}
            className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-primary">Recompensa</label>
          <input
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            placeholder="Ej. Pan gratis"
            className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        {message && <p className="text-sm text-muted">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Guardando..." : program ? "Guardar cambios" : "Crear programa"}
        </button>
      </form>
    </div>
  );
}
