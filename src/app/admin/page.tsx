import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import { TransactionItem } from "@/components/TransactionItem";
import type { Transaction, Profile } from "@/lib/types";

export default async function AdminDashboard() {
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
        Tu cuenta no tiene un negocio asignado. Pide al super administrador que te asocie a uno.
      </p>
    );
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: monthTransactions }, { data: progress }, { data: recent }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, customer_id")
      .eq("business_id", businessId)
      .gte("created_at", startOfMonth.toISOString()),
    supabase.from("customer_business_progress").select("id").eq("business_id", businessId),
    supabase
      .from("transactions")
      .select("*, profiles:customer_id(full_name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const purchasesThisMonth = (monthTransactions ?? []).filter((t) => t.type === "purchase").length;
  const redemptionsThisMonth = (monthTransactions ?? []).filter((t) => t.type === "redemption").length;
  const activeCustomers = new Set((monthTransactions ?? []).map((t) => t.customer_id)).size;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Compras del mes" value={purchasesThisMonth} />
        <StatCard label="Canjes del mes" value={redemptionsThisMonth} />
        <StatCard label="Clientes activos" value={activeCustomers} />
      </section>

      <section aria-labelledby="actividad-titulo">
        <h2 id="actividad-titulo" className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Actividad reciente
        </h2>
        {!recent?.length ? (
          <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
            Sin actividad todavía. Escanea el QR de un cliente para registrar su primera compra.
          </p>
        ) : (
          <ul className="grid gap-3">
            {(recent as (Transaction & { profiles: Pick<Profile, "full_name"> | null })[]).map((t) => (
              <TransactionItem
                key={t.id}
                type={t.type}
                businessName={t.profiles?.full_name || "Cliente"}
                amount={t.amount}
                note={t.note}
                createdAt={t.created_at}
              />
            ))}
          </ul>
        )}
      </section>

      {progress?.length === 0 && (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          Aún no tienes clientes con compras registradas en tu negocio.
        </p>
      )}
    </div>
  );
}
