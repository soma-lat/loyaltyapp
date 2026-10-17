"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TransactionItem } from "@/components/TransactionItem";
import type { Transaction, TransactionType } from "@/lib/types";

export const PAGE_SIZE = 20;

type Filter = "all" | TransactionType;
type Row = Transaction & { profiles: { full_name: string | null } | null };

export function ComprasView({
  businessId,
  initialRows,
  initialHasMore,
}: {
  businessId: string;
  initialRows: Row[];
  initialHasMore: boolean;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const fetchPage = useCallback(
    async (currentFilter: Filter, offset: number) => {
      let q = supabase
        .from("transactions")
        .select("*, profiles:customer_id(full_name)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (currentFilter !== "all") q = q.eq("type", currentFilter);

      const { data } = await q;
      return (data ?? []) as Row[];
    },
    [supabase, businessId]
  );

  async function handleFilterChange(next: Filter) {
    setFilter(next);
    setLoading(true);
    const page = await fetchPage(next, 0);
    setRows(page);
    setHasMore(page.length === PAGE_SIZE);
    setLoading(false);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    const page = await fetchPage(filter, rows.length);
    setRows((prev) => [...prev, ...page]);
    setHasMore(page.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "purchase", label: "Compras" },
    { value: "redemption", label: "Canjes" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilterChange(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              filter === f.value ? "bg-primary text-white" : "border border-bordercolor text-muted hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : !rows.length ? (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          Sin movimientos todavía.
        </p>
      ) : (
        <>
          <ul className="grid gap-3">
            {rows.map((t) => (
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
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full rounded-2xl border border-bordercolor py-3 text-sm font-bold text-primary hover:border-accent disabled:opacity-60"
            >
              {loadingMore ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
