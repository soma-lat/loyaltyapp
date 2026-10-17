import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { StatCard } from "@/components/StatCard";
import { NewBusinessForm } from "./NewBusinessForm";
import type { Business, Transaction } from "@/lib/types";

const links = [{ href: "/superadmin", label: "Negocios" }];

export default async function SuperAdminPage() {
  const supabase = createClient();

  const [{ data: businesses }, { data: transactions }] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("*, businesses:business_id(name)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const active = (businesses ?? []).filter((b) => b.status === "active").length;
  const suspended = (businesses ?? []).filter((b) => b.status === "suspended").length;
  const trial = (businesses ?? []).filter((b) => b.status === "trial").length;

  return (
    <div>
      <NavBar title="Super Admin" links={links} />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Negocios totales" value={businesses?.length ?? 0} />
          <StatCard label="Activos" value={active} />
          <StatCard label="En prueba" value={trial} />
          <StatCard label="Suspendidos" value={suspended} />
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Negocios
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Estatus</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(businesses as Business[] | null)?.map((b) => (
                    <tr key={b.id} className="border-t border-gray-100">
                      <td className="whitespace-nowrap px-4 py-2 text-gray-900">{b.name}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-600">{b.plan}</td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <Link href={`/superadmin/negocios/${b.id}`} className="text-brand-600 hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!businesses?.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                        Aún no hay negocios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Nuevo negocio
            </h2>
            <NewBusinessForm />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Transacciones globales recientes
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Negocio</th>
                  <th className="px-4 py-2">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {(transactions as (Transaction & { businesses: { name: string } })[] | null)?.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                      {new Date(t.created_at).toLocaleString("es-MX")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-900">{t.businesses?.name}</td>
                    <td className="whitespace-nowrap px-4 py-2">{t.type === "purchase" ? "Compra" : "Canje"}</td>
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

function StatusBadge({ status }: { status: Business["status"] }) {
  const styles: Record<Business["status"], string> = {
    active: "bg-green-50 text-green-700",
    trial: "bg-blue-50 text-blue-700",
    suspended: "bg-red-50 text-red-700",
  };
  const labels: Record<Business["status"], string> = {
    active: "Activo",
    trial: "Prueba",
    suspended: "Suspendido",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>{labels[status]}</span>;
}
