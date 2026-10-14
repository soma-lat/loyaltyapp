import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { Transaction, Business } from "@/lib/types";

const links = [
  { href: "/portal", label: "Mi código" },
  { href: "/portal/movimientos", label: "Movimientos" },
];

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
    <div>
      <NavBar title="Mi Lealtad" links={links} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-4 text-lg font-semibold text-gray-900">Movimientos</h1>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Negocio</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {(transactions as (Transaction & { businesses: Business })[] | null)?.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(t.created_at).toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-2 text-gray-900">{t.businesses?.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        t.type === "purchase"
                          ? "rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                      }
                    >
                      {t.type === "purchase" ? "Compra" : "Canje"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{t.note ?? "—"}</td>
                </tr>
              ))}
              {!transactions?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Sin movimientos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
