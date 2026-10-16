export function ProgressCard({
  businessName,
  purchasesCount,
  purchasesRequired,
  rewardDescription,
}: {
  businessName: string;
  purchasesCount: number;
  purchasesRequired: number | null;
  rewardDescription: string | null;
}) {
  const required = purchasesRequired ?? 0;
  const pct = required ? Math.min(100, (purchasesCount / required) * 100) : 0;
  const remaining = Math.max(0, required - purchasesCount);

  return (
    <article className="rounded-3xl border border-bordercolor bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="truncate font-bold text-primary">{businessName}</h3>
        <p className="shrink-0 text-sm text-muted">
          <span className="text-2xl font-extrabold text-primary">{purchasesCount}</span>
          {required ? ` / ${required}` : ""} compras
        </p>
      </div>

      {required > 0 ? (
        <>
          <div
            role="progressbar"
            aria-label={`Progreso en ${businessName}`}
            aria-valuemin={0}
            aria-valuemax={required}
            aria-valuenow={Math.min(purchasesCount, required)}
            className="h-2.5 w-full overflow-hidden rounded-full bg-surface ring-1 ring-inset ring-bordercolor"
          >
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted">
            {remaining === 0
              ? "Recompensa lista."
              : `Te ${remaining === 1 ? "falta 1 compra" : `faltan ${remaining} compras`} para tu recompensa.`}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">Este negocio no tiene un programa activo.</p>
      )}

      {rewardDescription && (
        <p className="mt-3 rounded-2xl bg-surface px-3 py-2 text-sm font-semibold text-primary">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Recompensa </span>
          {rewardDescription}
        </p>
      )}
    </article>
  );
}
