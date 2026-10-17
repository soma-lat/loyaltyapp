type TrendPoint = { label: string; purchases: number; redemptions: number };

const CHART_HEIGHT = 120;
const BAR_GAP = 3;

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.purchases, d.redemptions)));
  const groupWidth = 100 / Math.max(1, data.length);
  const barWidth = groupWidth / 2 - BAR_GAP / 2;

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-32 w-full"
        role="img"
        aria-label={`Tendencia de compras y canjes de los últimos ${data.length} días`}
      >
        {data.map((d, i) => {
          const x = i * groupWidth;
          const purchaseHeight = (d.purchases / max) * (CHART_HEIGHT - 4);
          const redemptionHeight = (d.redemptions / max) * (CHART_HEIGHT - 4);
          return (
            <g key={d.label}>
              <rect
                x={x + BAR_GAP / 2}
                y={CHART_HEIGHT - purchaseHeight}
                width={barWidth}
                height={purchaseHeight}
                className="fill-accent"
                rx={1}
              />
              <rect
                x={x + groupWidth / 2}
                y={CHART_HEIGHT - redemptionHeight}
                width={barWidth}
                height={redemptionHeight}
                className="fill-red-400"
                rx={1}
              />
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wide text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Compras
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Canjes
        </span>
      </div>
    </div>
  );
}
