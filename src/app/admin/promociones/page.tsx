import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";
import { PromocionesView } from "./PromocionesView";
import type { LoyaltyProgram } from "@/lib/types";

export default async function PromocionesPage() {
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

  const { data: promotions } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return <PromocionesView businessId={businessId} initialPromotions={(promotions ?? []) as LoyaltyProgram[]} />;
}
