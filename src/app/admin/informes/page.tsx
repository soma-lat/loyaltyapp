import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";
import { StatCard } from "@/components/StatCard";
import { TrendChart } from "@/components/TrendChart";
import type { TransactionType } from "@/lib/types";

const TREND_DAYS = 14;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseRange(searchParams: { from?: string; to?: string }) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const from = searchParams.from ? new Date(`${searchParams.from}T00:00:00`) : startOfMonth;
  const to = searchParams.to ? new Date(`${searchParams.to}T23:59:59.999`) : today;

  return { from, to };
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
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
  const { from, to } = parseRange(searchParams);

  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  trendStart.setHours(0, 0, 0, 0);

  const [{ data: rangeTransactions }, { data: trendTransactions }, { data: programs }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, customer_id, loyalty_program_id, profiles:customer_id(full_name)")
      .eq("business_id", businessId)
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString()),
    supabase
      .from("transactions")
      .select("type, created_at")
      .eq("business_id", businessId)
      .gte("created_at", trendStart.toISOString()),
    supabase.from("loyalty_programs").select("id, name").eq("business_id", businessId),
  ]);

  const rows = (rangeTransactions ?? []) as any[];
  const purchasesInRange = rows.filter((t) => t.type === "purchase").length;
  const redemptionsInRange = rows.filter((t) => t.type === "redemption").length;
  const activeCustomers = new Set(rows.map((t) => t.customer_id)).size;

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
  for (const row of rows) {
    if (row.type !== "purchase") continue;
    const id = row.customer_id;
    const name = row.profiles?.full_name || "Cliente";
    const entry = countsByCustomer.get(id) ?? { name, count: 0 };
    entry.count += 1;
    countsByCustomer.set(id, entry);
  }
  const topCustomers = Array.from(countsByCustomer.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const programNameById = new Map((programs ?? []).map((p) => [p.id, p.name]));
  const countsByProgram = new Map<string, { name: string; purchases: number; redemptions: number }>();
  for (const row of rows) {
    if (!row.loyalty_program_id) continue;
    const name = programNameById.get(row.loyalty_program_id) ?? "Promoción eliminada";
    const entry = countsByProgram.get(row.loyalty_program_id) ?? { name, purchases: 0, redemptions: 0 };
    if (row.type === "purchase") entry.purchases += 1;
    else entry.redemptions += 1;
    countsByProgram.set(row.loyalty_program_id, entry);
  }
  const programStats = Array.from(countsByProgram.values()).sort((a, b) => b.purchases - a.purchases);

  const fromValue = from.toISOString().slice(0, 10);
  const toValue = to.toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <form className="flex flex-wrap items-end gap-3 rounded-3xl border border-bordercolor bg-white p-4" method="get">
        <div className="space-y-1">
          <label className="text-xs font-bold text-primary">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={fromValue}
            className="rounded-2xl border border-bordercolor px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-primary">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={toValue}
            className="rounded-2xl border border-bordercolor px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          Aplicar
        </button>
        <a
          href={`/api/admin/informes/export?from=${fromValue}&to=${toValue}`}
          className="rounded-2xl border border-bordercolor px-4 py-2 text-sm font-bold text-primary hover:bg-surface"
        >
          Exportar CSV
        </a>
      </form>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Compras en el período" value={purchasesInRange} />
        <StatCard label="Canjes en el período" value={redemptionsInRange} />
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
          Promociones en el período
        </h2>
        {!programStats.length ? (
          <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
            Sin actividad de promociones en este período.
          </p>
        ) : (
          <ul className="grid gap-2">
            {programStats.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-3 rounded-2xl border border-bordercolor bg-white p-3"
              >
                <span className="truncate text-sm font-bold text-primary">{p.name}</span>
                <span className="shrink-0 text-sm text-muted">
                  {p.purchases} compra{p.purchases === 1 ? "" : "s"} · {p.redemptions} canje
                  {p.redemptions === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Clientes más frecuentes
        </h2>
        {!topCustomers.length ? (
          <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
            Aún no hay compras registradas en este período.
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

      <Link href="/admin/seguridad" className="text-sm font-bold text-accent underline">
        Ver registro de seguridad →
      </Link>
    </div>
  );
}
