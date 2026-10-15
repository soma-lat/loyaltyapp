"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BusinessStatus } from "@/lib/types";

const statuses: BusinessStatus[] = ["trial", "active", "suspended"];

export function BusinessStatusControl({
  businessId,
  currentStatus,
}: {
  businessId: string;
  currentStatus: BusinessStatus;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function update(next: BusinessStatus) {
    setSaving(true);
    const { error } = await supabase.from("businesses").update({ status: next }).eq("id", businessId);
    setSaving(false);
    if (!error) {
      setStatus(next);
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-medium text-gray-700">Estatus del negocio</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            disabled={saving}
            onClick={() => update(s)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              status === s ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s === "active" ? "Activo" : s === "trial" ? "Prueba" : "Suspendido"}
          </button>
        ))}
      </div>
    </div>
  );
}
