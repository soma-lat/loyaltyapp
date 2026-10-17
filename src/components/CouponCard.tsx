import { GiftIcon } from "@/components/icons";

export function CouponCard({
  rewardDescription,
  businessName,
  createdAt,
}: {
  rewardDescription: string;
  businessName: string;
  createdAt: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
        <GiftIcon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-emerald-900">{rewardDescription}</h3>
        {businessName && <p className="truncate text-sm text-emerald-800">{businessName}</p>}
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          Obtenido el{" "}
          {new Date(createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        Disponible
      </span>
    </article>
  );
}
