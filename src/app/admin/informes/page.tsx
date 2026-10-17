import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import { TrendChart } from "@/components/TrendChart";
import type { TransactionType } from "@/lib/types";

const TREND_DAYS = 14;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function InformesPage() {
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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  trendStart.setHours(0, 0, 0, 0);

  const [{ data: monthTransactions }, { data: trendTransactions }, { data: purchaseTransactions }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("type, customer_id")
        .eq("business_id", businessId)
        .gte("created_at", startOfMonth.toISOString()),
      supabase
        .from("transactions")
        .select("type, created_at")
        .eq("business_id", businessId)
        .gte("created_at", trendStart.toISOString()),
      supabase
        .from("transactions")
        .select("customer_id, profiles:customer_id(full_name)")
        .eq("business_id", businessId)
        .eq("type", "purchase"),
    ]);

  const purchasesThisMonth = (monthTransactions ?? []).filter((t) => t.type === "purchase").length;
  const redemptionsThisMonth = (monthTransactions ?? []).filter((t) => t.type === "redemption").length;
  const activeCustomers = new Set((monthTransactions ?? []).map((t) => t.customer_id)).size;

  const buckets = new Map<string, { purchases: number; redemptions: number }>();
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart);
    d.setDate(trendStart.getDate() + i);
    buckets.set(dateKey(d), { purchases: 0, redemptions: 0 });
  }
  for (const t of (trendTransactions ?? []) as { type: TransactionType; created_at: string }[]) {
    const key = dateKey(new Date(t.created_at));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "purchase") bucket.purchases += 1;
    else bucket.redemptions += 1;
  }
  const trendData = Array.from(buckets.entries()).map(([key, counts]) => ({
    label: new Date(key).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
    ...counts,
  }));

  const countsByCustomer = new Map<string, { name: string; count: number }>();
  for (const row of (purchaseTransactions ?? []) as any[]) {
    const id = row.customer_id;
    const name = row.profiles?.full_name || "Cliente";
    const entry = countsByCustomer.get(id) ?? { name, count: 0 };
    entry.count += 1;
    countsByCustomer.set(id, entry);
  }
  const topCustomers = Array.from(countsByCustomer.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Compras del mes" value={purchasesThisMonth} />
        <StatCard label="Canjes del mes" value={redemptionsThisMonth} />
        <StatCard label="Clientes activos" value={activeCustomers} />
      </section>

      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Tendencia (últimos {TREND_DAYS} días)
        </h2>
        <div className="rounded-3xl border border-bordercolor bg-white p-5">
          <TrendChart data={trendData} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Clientes más frecuentes
        </h2>
        {!topCustomers.length ? (
          <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
            Aún no hay compras registradas.
          </p>
        ) : (
          <ol className="grid gap-2">
            {topCustomers.map((c, i) => (
              <li
                key={c.name + i}
                className="flex items-center gap-3 rounded-2xl border border-bordercolor bg-white p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-bold text-primary">{c.name}</span>
                <span className="shrink-0 text-sm text-muted">
                  {c.count} compra{c.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
