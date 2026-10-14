import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { QrCode } from "@/components/QrCode";
import type { Coupon, CustomerBusinessProgress, LoyaltyProgram, Business } from "@/lib/types";

const links = [
  { href: "/portal", label: "Mi código" },
  { href: "/portal/movimientos", label: "Movimientos" },
];

export default async function PortalPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: progressRows }, { data: coupons }] = await Promise.all([
    supabase
      .from("customer_business_progress")
      .select("*, businesses:business_id(id, name)")
      .eq("customer_id", user.id),
    supabase
      .from("coupons")
      .select("*, businesses:business_id(id, name)")
      .eq("customer_id", user.id)
      .eq("status", "available")
      .order("created_at", { ascending: false }),
  ]);

  const businessIds = (progressRows ?? []).map((p: any) => p.business_id);
  const { data: programs } = businessIds.length
    ? await supabase
        .from("loyalty_programs")
        .select("*")
        .in("business_id", businessIds)
        .eq("active", true)
    : { data: [] as LoyaltyProgram[] };

  const programByBusiness = new Map((programs ?? []).map((p: LoyaltyProgram) => [p.business_id, p]));

  return (
    <div>
      <NavBar title="Mi Lealtad" links={links} />
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <section className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Tu código de cliente</h1>
          <QrCode value={user.id} />
          <p className="text-xs text-gray-500">Muéstralo en el negocio para registrar tu compra.</p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cupones vigentes
          </h2>
          {!coupons?.length && (
            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              Aún no tienes cupones disponibles.
            </p>
          )}
          <div className="grid gap-3">
            {(coupons as (Coupon & { businesses: { name: string } })[] | null)?.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
              >
                <div>
                  <p className="font-medium text-green-800">{c.reward_description}</p>
                  <p className="text-xs text-green-700">{c.businesses?.name}</p>
                </div>
                <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
                  Disponible
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Progreso por negocio
          </h2>
          {!progressRows?.length && (
            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              Aún no tienes compras registradas en ningún negocio.
            </p>
          )}
          <div className="grid gap-3">
            {(progressRows as (CustomerBusinessProgress & { businesses: Business })[] | null)?.map(
              (p) => {
                const program = programByBusiness.get(p.business_id);
                const required = program?.purchases_required ?? 0;
                const pct = required ? Math.min(100, (p.purchases_count / required) * 100) : 0;
                return (
                  <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-gray-900">{p.businesses?.name}</span>
                      <span className="text-sm text-gray-500">
                        {p.purchases_count}/{required || "—"} compras
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {program && (
                      <p className="mt-2 text-xs text-gray-500">Recompensa: {program.reward_description}</p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
