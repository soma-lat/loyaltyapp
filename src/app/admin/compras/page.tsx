import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";
import { ComprasView, PAGE_SIZE } from "./ComprasView";

export default async function ComprasPage() {
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

  const { data: rows } = await supabase
    .from("transactions")
    .select("*, profiles:customer_id(full_name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return (
    <ComprasView
      businessId={businessId}
      initialRows={rows ?? []}
      initialHasMore={(rows ?? []).length === PAGE_SIZE}
    />
  );
}
