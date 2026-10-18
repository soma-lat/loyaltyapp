import { createClient } from "@/lib/supabase/server";
import { ScanView } from "./ScanView";
import type { LoyaltyProgram } from "@/lib/types";

export default async function ScanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  const businessId = profile?.business_id;

  if (!businessId) {
    return (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Tu cuenta no tiene un negocio asignado todavía.
      </p>
    );
  }

  const { data: activePromotions } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return <ScanView activePromotions={(activePromotions ?? []) as LoyaltyProgram[]} />;
}
