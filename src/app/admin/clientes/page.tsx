import { createClient } from "@/lib/supabase/server";
import { ClientesView } from "./ClientesView";
import type { Coupon, LoyaltyProgram } from "@/lib/types";

export default async function ClientesPage() {
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

  const [{ data: progressRows }, { data: promotions }, { data: availableCoupons }] = await Promise.all([
    supabase
      .from("customer_business_progress")
      .select("customer_id, purchases_count, loyalty_program_id, profiles:customer_id(full_name)")
      .eq("business_id", businessId),
    supabase
      .from("loyalty_programs")
      .select("*")
      .eq("business_id", businessId)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase.from("coupons").select("*").eq("business_id", businessId).eq("status", "available"),
  ]);

  const progress = ((progressRows ?? []) as any[]).map((r) => ({
    customerId: r.customer_id as string,
    fullName: (r.profiles?.full_name as string | null) || "Cliente",
    purchasesCount: r.purchases_count as number,
    loyaltyProgramId: r.loyalty_program_id as string,
  }));

  return (
    <ClientesView
      progress={progress}
      promotions={(promotions ?? []) as LoyaltyProgram[]}
      initialCoupons={(availableCoupons ?? []) as Coupon[]}
    />
  );
}
