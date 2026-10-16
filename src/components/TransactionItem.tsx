import { GiftIcon, PlusIcon } from "@/components/icons";
import type { TransactionType } from "@/lib/types";

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function TransactionItem({
  type,
  businessName,
  amount,
  note,
  createdAt,
}: {
  type: TransactionType;
  businessName: string;
  amount: number | null;
  note: string | null;
  createdAt: string;
}) {
  const isPurchase = type === "purchase";
  const date = new Date(createdAt).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex items-center gap-4 rounded-3xl border border-bordercolor bg-white p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          isPurchase ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}
      >
        {isPurchase ? <PlusIcon className="h-5 w-5" /> : <GiftIcon className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-primary">{businessName || "Negocio"}</p>
        <p className="truncate text-sm text-muted">{note || (isPurchase ? "Compra registrada" : "Cupón canjeado")}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
          <time dateTime={createdAt}>{date}</time>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-extrabold ${isPurchase ? "text-emerald-600" : "text-red-600"}`}>
          {isPurchase ? "+1 compra" : "Canje"}
        </p>
        {amount != null && <p className="text-xs text-muted">{currency.format(Number(amount))}</p>}
      </div>
    </li>
  );
}
