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

  const [{ data: progressRows }, { data: activeProgram }, { data: availableCoupons }] = await Promise.all([
    supabase
      .from("customer_business_progress")
      .select("customer_id, purchases_count, profiles:customer_id(full_name)")
      .eq("business_id", businessId),
    supabase
      .from("loyalty_programs")
      .select("*")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("coupons").select("*").eq("business_id", businessId).eq("status", "available"),
  ]);

  const customers = ((progressRows ?? []) as any[]).map((r) => ({
    customerId: r.customer_id as string,
    fullName: (r.profiles?.full_name as string | null) || "Cliente",
    purchasesCount: r.purchases_count as number,
  }));

  return (
    <ClientesView
      initialCustomers={customers}
      program={(activeProgram as LoyaltyProgram | null) ?? null}
      initialCoupons={(availableCoupons ?? []) as Coupon[]}
    />
  );
}
