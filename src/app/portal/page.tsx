import { createClient } from "@/lib/supabase/server";
import { QrCredentialModal } from "@/components/QrCredentialModal";
import { ProgressCard } from "@/components/ProgressCard";
import { CouponCard } from "@/components/CouponCard";
import type { Coupon, CustomerBusinessProgress, LoyaltyProgram, Business } from "@/lib/types";

export default async function PortalPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: progressRows }, { data: coupons }, { data: profile }] = await Promise.all([
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
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
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
  const memberName = profile?.full_name || user.email || "Socio";
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-primary p-6 text-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Tu credencial</p>
        <h2 className="mt-1 text-2xl font-extrabold">{firstName ? `Hola, ${firstName}` : "Hola"}</h2>
        <p className="mt-1 mb-5 text-sm text-gray-300">
          Muestra tu código en el negocio cada vez que compres.
        </p>
        <QrCredentialModal memberId={user.id} memberName={memberName} />
      </section>

      <section aria-labelledby="cupones-titulo">
        <h2 id="cupones-titulo" className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Cupones vigentes
        </h2>
        {!coupons?.length ? (
          <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
            Aún no tienes cupones disponibles.
          </p>
        ) : (
          <div className="grid gap-3">
            {(coupons as (Coupon & { businesses: { name: string } })[]).map((c) => (
              <CouponCard
                key={c.id}
                rewardDescription={c.reward_description}
                businessName={c.businesses?.name ?? ""}
                createdAt={c.created_at}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="progreso-titulo">
        <h2 id="progreso-titulo" className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Progreso por negocio
        </h2>
        {!progressRows?.length ? (
          <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
            Aún no tienes compras registradas en ningún negocio.
          </p>
        ) : (
          <div className="grid gap-3">
            {(progressRows as (CustomerBusinessProgress & { businesses: Business })[]).map((p) => {
              const program = programByBusiness.get(p.business_id);
              return (
                <ProgressCard
                  key={p.id}
                  businessName={p.businesses?.name ?? ""}
                  purchasesCount={p.purchases_count}
                  purchasesRequired={program?.purchases_required ?? null}
                  rewardDescription={program?.reward_description ?? null}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
