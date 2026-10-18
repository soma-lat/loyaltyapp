"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QrScanner } from "@/components/QrScanner";
import { GiftIcon, AlertIcon, CheckIcon } from "@/components/icons";
import type { LoyaltyProgram } from "@/lib/types";

type Result = {
  purchases_count: number;
  purchases_required: number;
  coupon_issued: boolean;
} | null;

export function ScanView({ activePromotions }: { activePromotions: LoyaltyProgram[] }) {
  const supabase = createClient();
  const [promotionId, setPromotionId] = useState<string | null>(
    activePromotions.length === 1 ? activePromotions[0].id : null
  );
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [note, setNote] = useState("");

  if (!activePromotions.length) {
    return (
      <div className="space-y-3 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
        <p>No tienes ninguna promoción activa. Activa una para poder registrar compras.</p>
        <Link href="/admin/promociones" className="font-bold underline">
          Ir a Promociones
        </Link>
      </div>
    );
  }

  if (!promotionId) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-primary">¿A cuál promoción aplica esta compra?</p>
        <div className="grid gap-2">
          {activePromotions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPromotionId(p.id)}
              className="rounded-2xl border border-bordercolor bg-white p-4 text-left hover:border-accent"
            >
              <p className="font-bold text-primary">{p.name}</p>
              <p className="text-sm text-muted">
                {p.purchases_required} compras → {p.reward_description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  async function handleResult(customerId: string) {
    if (!scanning) return;
    setScanning(false);
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .rpc("register_purchase", { p_customer_id: customerId, p_program_id: promotionId, p_note: note || null })
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setResult(data as Result);
  }

  function reset() {
    setResult(null);
    setError(null);
    setScanning(true);
  }

  return (
    <div className="space-y-5">
      {activePromotions.length > 1 && (
        <button type="button" onClick={() => setPromotionId(null)} className="text-sm font-bold text-accent underline">
          Cambiar promoción
        </button>
      )}

      <div className="space-y-1">
        <label className="text-sm font-bold text-primary">Nota (opcional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. café americano"
          className="w-full rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      {scanning && (
        <div className="overflow-hidden rounded-3xl border border-bordercolor">
          <QrScanner onResult={handleResult} />
        </div>
      )}

      {loading && <p className="text-sm text-muted">Registrando compra...</p>}

      {error && (
        <div className="space-y-3 rounded-3xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <AlertIcon className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={reset} className="text-sm font-bold text-red-700 underline">
            Escanear otro
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckIcon className="h-5 w-5 shrink-0" />
            <p className="font-bold">Compra registrada</p>
          </div>
          <p className="text-sm text-emerald-800">
            Progreso: {result.purchases_count}/{result.purchases_required}
          </p>
          {result.coupon_issued && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
              <GiftIcon className="h-5 w-5 shrink-0" />
              Se generó un cupón de recompensa para el cliente
            </div>
          )}
          <button
            onClick={reset}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white hover:opacity-90"
          >
            Escanear otro cliente
          </button>
        </div>
      )}
    </div>
  );
}
