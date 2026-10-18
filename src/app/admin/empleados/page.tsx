import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";
import { EmpleadosView } from "./EmpleadosView";
import type { Profile } from "@/lib/types";

export default async function EmpleadosPage() {
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

  const supabase = createClient();
  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .eq("business_id", ctx.businessId)
    .eq("role", "employee")
    .order("full_name", { ascending: true });

  return <EmpleadosView initialEmployees={(employees ?? []) as Profile[]} />;
}
