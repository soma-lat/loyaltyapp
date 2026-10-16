import { createClient } from "@/lib/supabase/server";
import { TransactionItem } from "@/components/TransactionItem";
import type { Transaction, Business } from "@/lib/types";

export default async function MovimientosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, businesses:business_id(id, name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section aria-labelledby="historial-titulo">
      <h2 id="historial-titulo" className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
        Historial de compras y canjes
      </h2>
      {!transactions?.length ? (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          Sin movimientos todavía.
        </p>
      ) : (
        <ul className="grid gap-3">
          {(transactions as (Transaction & { businesses: Business })[]).map((t) => (
            <TransactionItem
              key={t.id}
              type={t.type}
              businessName={t.businesses?.name ?? ""}
              amount={t.amount}
              note={t.note}
              createdAt={t.created_at}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
