import { createClient } from "@/lib/supabase/server";
import { ComprasView, PAGE_SIZE } from "./ComprasView";

export default async function ComprasPage() {
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
