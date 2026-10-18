"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LoyaltyProgram, PromotionStatus } from "@/lib/types";

const STATUS_LABEL: Record<PromotionStatus, string> = {
  draft: "Borrador",
  active: "Activa",
  paused: "Pausada",
  finished: "Finalizada",
};

const STATUS_BADGE: Record<PromotionStatus, string> = {
  draft: "bg-surface text-muted",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  finished: "bg-surface text-muted",
};

function NEXT_ACTIONS(status: PromotionStatus): { label: string; next: PromotionStatus }[] {
  if (status === "draft") return [{ label: "Activar", next: "active" }];
  if (status === "active") {
    return [
      { label: "Pausar", next: "paused" },
      { label: "Finalizar", next: "finished" },
    ];
  }
  if (status === "paused") {
    return [
      { label: "Reanudar", next: "active" },
      { label: "Finalizar", next: "finished" },
    ];
  }
  return [];
}

export function PromocionesView({
  businessId,
  initialPromotions,
}: {
  businessId: string;
  initialPromotions: LoyaltyProgram[];
}) {
  const supabase = createClient();
  const [promotions, setPromotions] = useState(initialPromotions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", purchases_required: 6, reward_description: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const { data, error } = await supabase
      .from("loyalty_programs")
      .insert({
        business_id: businessId,
        name: form.name || "Programa de lealtad",
        purchases_required: form.purchases_required,
        reward_description: form.reward_description || "Producto gratis",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }
    setPromotions((prev) => [data as LoyaltyProgram, ...prev]);
    setForm({ name: "", purchases_required: 6, reward_description: "" });
    setCreating(false);
  }

  async function handleUpdate(promotion: LoyaltyProgram, patch: Partial<LoyaltyProgram>) {
    setMessage(null);
    const { data, error } = await supabase
      .from("loyalty_programs")
      .update(patch)
      .eq("id", promotion.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }
    setPromotions((prev) => prev.map((p) => (p.id === promotion.id ? (data as LoyaltyProgram) : p)));
  }

  return (
    <div className="space-y-6">
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full rounded-2xl border border-dashed border-bordercolor py-3 text-sm font-bold text-primary hover:bg-surface"
        >
          + Nueva promoción
        </button>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4 rounded-3xl border border-bordercolor bg-white p-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Programa de cafés"
              className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Compras necesarias</label>
            <input
              type="number"
              min={1}
              value={form.purchases_required}
              onChange={(e) => setForm((f) => ({ ...f, purchases_required: Number(e.target.value) }))}
              className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Recompensa</label>
            <input
              value={form.reward_description}
              onChange={(e) => setForm((f) => ({ ...f, reward_description: e.target.value }))}
              placeholder="Ej. Café gratis"
              className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-2xl border border-bordercolor py-3 text-sm font-bold text-muted hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Crear como borrador
            </button>
          </div>
        </form>
      )}

      {message && <p className="text-sm text-muted">{message}</p>}

      {!promotions.length && (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          Aún no tienes promociones. Crea la primera para empezar a registrar compras.
        </p>
      )}

      <div className="grid gap-3">
        {promotions.map((promotion) =>
          editingId === promotion.id ? (
            <EditCard
              key={promotion.id}
              promotion={promotion}
              onCancel={() => setEditingId(null)}
              onSave={async (patch) => {
                await handleUpdate(promotion, patch);
                setEditingId(null);
              }}
            />
          ) : (
            <div key={promotion.id} className="space-y-3 rounded-3xl border border-bordercolor bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-primary">{promotion.name}</p>
                  <p className="text-sm text-muted">
                    {promotion.purchases_required} compras → {promotion.reward_description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[promotion.status]}`}
                >
                  {STATUS_LABEL[promotion.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {promotion.status !== "finished" && (
                  <button
                    type="button"
                    onClick={() => setEditingId(promotion.id)}
                    className="rounded-2xl border border-bordercolor px-4 py-2 text-sm font-bold text-primary hover:bg-surface"
                  >
                    Editar
                  </button>
                )}
                {NEXT_ACTIONS(promotion.status).map(({ label, next }) => (
                  <button
                    key={next}
                    type="button"
                    onClick={() => handleUpdate(promotion, { status: next })}
                    className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EditCard({
  promotion,
  onSave,
  onCancel,
}: {
  promotion: LoyaltyProgram;
  onSave: (patch: Partial<LoyaltyProgram>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(promotion.name);
  const [purchasesRequired, setPurchasesRequired] = useState(promotion.purchases_required);
  const [rewardDescription, setRewardDescription] = useState(promotion.reward_description);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, purchases_required: purchasesRequired, reward_description: rewardDescription });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-bordercolor bg-white p-5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
      <input
        type="number"
        min={1}
        value={purchasesRequired}
        onChange={(e) => setPurchasesRequired(Number(e.target.value))}
        className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
      <input
        value={rewardDescription}
        onChange={(e) => setRewardDescription(e.target.value)}
        className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-bordercolor py-3 text-sm font-bold text-muted hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
