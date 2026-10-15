import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { Transaction } from "@/lib/types";

const links = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/scan", label: "Escanear" },
  { href: "/admin/programa", label: "Programa" },
];

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  const businessId = profile?.business_id;

  const [{ data: business }, { data: transactions }, { data: progress }] = await Promise.all([
    businessId
      ? supabase.from("businesses").select("*").eq("id", businessId).single()
      : Promise.resolve({ data: null }),
    businessId
      ? supabase
          .from("transactions")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as Transaction[] }),
    businessId
      ? supabase.from("customer_business_progress").select("id").eq("business_id", businessId)
      : Promise.resolve({ data: [] }),
  ]);

  const purchases = (transactions ?? []).filter((t) => t.type === "purchase").length;
  const redemptions = (transactions ?? []).filter((t) => t.type === "redemption").length;

  return (
    <div>
      <NavBar title={business?.name ?? "Panel del negocio"} links={links} />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        {!businessId && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Tu cuenta no tiene un negocio asignado. Pide al super administrador que te asocie a uno.
          </p>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Clientes con progreso" value={progress?.length ?? 0} />
          <StatCard label="Compras (últimas 20)" value={purchases} />
          <StatCard label="Canjes (últimas 20)" value={redemptions} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Transacciones recientes
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Nota</th>
                </tr>
              </thead>
              <tbody>
                {(transactions as Transaction[] | null)?.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                      {new Date(t.created_at).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-2">{t.type === "purchase" ? "Compra" : "Canje"}</td>
                    <td className="px-4 py-2 text-gray-600">{t.note ?? "—"}</td>
                  </tr>
                ))}
                {!transactions?.length && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                      Sin transacciones todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
