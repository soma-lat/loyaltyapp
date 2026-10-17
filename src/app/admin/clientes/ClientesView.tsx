"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { ProgressCard } from "@/components/ProgressCard";
import { CouponCard } from "@/components/CouponCard";
import { useToast } from "@/components/Toast";
import { SearchIcon, GiftIcon } from "@/components/icons";
import type { Coupon, LoyaltyProgram } from "@/lib/types";

type CustomerRow = {
  customerId: string;
  fullName: string;
  purchasesCount: number;
};

export function ClientesView({
  initialCustomers,
  program,
  initialCoupons,
}: {
  initialCustomers: CustomerRow[];
  program: LoyaltyProgram | null;
  initialCoupons: Coupon[];
}) {
  const supabase = createClient();
  const showToast = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialCustomers;
    return initialCustomers.filter((c) => c.fullName.toLowerCase().includes(q));
  }, [initialCustomers, query]);

  const selected = initialCustomers.find((c) => c.customerId === selectedId) ?? null;
  const selectedCoupons = coupons.filter((c) => c.customer_id === selectedId);

  async function handleRedeem(couponId: string) {
    setRedeeming(couponId);
    const { error } = await supabase.rpc("redeem_coupon", { p_coupon_id: couponId });
    setRedeeming(null);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    showToast("Cupón canjeado");
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente por nombre"
          className="w-full rounded-2xl border border-bordercolor py-3 pl-11 pr-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      {!filtered.length ? (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          {initialCustomers.length ? "Ningún cliente coincide con tu búsqueda." : "Aún no tienes clientes registrados."}
        </p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((c) => {
            const couponCount = coupons.filter((co) => co.customer_id === c.customerId).length;
            return (
              <li key={c.customerId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.customerId)}
                  className="flex w-full items-center gap-4 rounded-3xl border border-bordercolor bg-white p-4 text-left hover:border-accent"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
                    {c.fullName
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="truncate font-bold text-primary">{c.fullName}</p>
                    <p className="text-sm text-muted">
                      {c.purchasesCount} compra{c.purchasesCount === 1 ? "" : "s"}
                    </p>
                  </span>
                  {couponCount > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                      <GiftIcon className="h-3.5 w-3.5" />
                      {couponCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.fullName ?? "Cliente"}>
        {selected && (
          <div className="space-y-4">
            <ProgressCard
              businessName="Progreso en tu negocio"
              purchasesCount={selected.purchasesCount}
              purchasesRequired={program?.purchases_required ?? null}
              rewardDescription={program?.reward_description ?? null}
            />

            <div>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                Cupones disponibles
              </h3>
              {!selectedCoupons.length ? (
                <p className="rounded-2xl border border-dashed border-bordercolor p-4 text-sm text-muted">
                  Este cliente no tiene cupones disponibles.
                </p>
              ) : (
                <div className="grid gap-3">
                  {selectedCoupons.map((coupon) => (
                    <div key={coupon.id} className="space-y-2">
                      <CouponCard
                        rewardDescription={coupon.reward_description}
                        businessName=""
                        createdAt={coupon.created_at}
                      />
                      <button
                        type="button"
                        disabled={redeeming === coupon.id}
                        onClick={() => handleRedeem(coupon.id)}
                        className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {redeeming === coupon.id ? "Canjeando..." : "Canjear"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
