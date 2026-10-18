import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";
import type { AuditLogEntry } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  privilege_escalation_blocked: "Intento de cambio de permisos bloqueado",
  promotion_status_changed: "Cambio de estado de promoción",
};

function describe(entry: AuditLogEntry) {
  const d = entry.detail ?? {};
  if (entry.action === "privilege_escalation_blocked") {
    return `Se bloqueó un cambio de "${d.field}" en ${d.table} (de "${d.kept}" a "${d.attempted}").`;
  }
  if (entry.action === "promotion_status_changed") {
    return `"${d.promotion_name}": ${d.from} → ${d.to}.`;
  }
  return JSON.stringify(d);
}

export default async function SeguridadPage() {
  const ctx = await getAdminContext();

  if (!ctx?.businessId) {
    return (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Tu cuenta no tiene un negocio asignado todavía.
      </p>
    );
  }

  if (ctx.role !== "business_admin") {
    return (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        No tienes permiso para ver esta sección.
      </p>
    );
  }

  const businessId = ctx.businessId;
  const supabase = createClient();

  const { data: entries } = await supabase
    .from("audit_log")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Registro de intentos de cambios de permisos bloqueados y de cambios en el estado de tus promociones.
      </p>

      {!entries?.length ? (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          Sin actividad registrada todavía.
        </p>
      ) : (
        <ul className="grid gap-3">
          {(entries as AuditLogEntry[]).map((entry) => (
            <li key={entry.id} className="rounded-3xl border border-bordercolor bg-white p-4">
              <p className="text-sm font-bold text-primary">{ACTION_LABEL[entry.action] ?? entry.action}</p>
              <p className="text-sm text-muted">{describe(entry)}</p>
              <p className="mt-1 text-xs text-muted">{new Date(entry.created_at).toLocaleString("es-MX")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
