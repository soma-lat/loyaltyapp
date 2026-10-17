export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-bordercolor bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
    </div>
  );
}
