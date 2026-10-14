"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QrScanner } from "@/components/QrScanner";

type Result = {
  purchases_count: number;
  purchases_required: number;
  coupon_issued: boolean;
} | null;

export default function ScanPage() {
  const supabase = createClient();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [note, setNote] = useState("");

  async function handleResult(customerId: string) {
    if (!scanning) return;
    setScanning(false);
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .rpc("register_purchase", { p_customer_id: customerId, p_note: note || null })
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
    <div className="mx-auto max-w-md space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Escanear compra</h1>
        <Link href="/admin" className="text-sm text-brand-600 hover:underline">
          Volver
        </Link>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nota (opcional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. café americano"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {scanning && <QrScanner onResult={handleResult} />}

      {loading && <p className="text-sm text-gray-500">Registrando compra...</p>}

      {error && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={reset} className="text-sm font-medium text-red-700 underline">
            Escanear otro
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">Compra registrada</p>
          <p className="text-sm text-green-700">
            Progreso: {result.purchases_count}/{result.purchases_required}
          </p>
          {result.coupon_issued && (
            <p className="text-sm font-semibold text-green-800">
              🎉 ¡Se generó un cupón de recompensa para el cliente!
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Escanear otro cliente
          </button>
        </div>
      )}
    </div>
  );
}
