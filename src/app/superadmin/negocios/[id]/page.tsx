import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { BusinessStatusControl } from "./BusinessStatusControl";
import { AssignAdminForm } from "./AssignAdminForm";
import type { Transaction } from "@/lib/types";

const links = [{ href: "/superadmin", label: "Negocios" }];

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: business }, { data: admins }, { data: transactions }, { data: programs }] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("id", params.id).single(),
      supabase.from("profiles").select("id, full_name").eq("business_id", params.id).eq("role", "business_admin"),
      supabase
        .from("transactions")
        .select("*")
        .eq("business_id", params.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase.from("loyalty_programs").select("*").eq("business_id", params.id),
    ]);

  if (!business) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-gray-500">Negocio no encontrado.</p>
        <Link href="/superadmin" className="text-sm text-brand-600 hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div>
      <NavBar title="Super Admin" links={links} />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <div>
          <Link href="/superadmin" className="text-sm text-brand-600 hover:underline">
            ← Volver a negocios
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">{business.name}</h1>
          <p className="text-sm text-gray-500">slug: {business.slug}</p>
        </div>

        <section className="grid gap-6 sm:grid-cols-2">
          <BusinessStatusControl businessId={business.id} currentStatus={business.status} />
          <AssignAdminForm businessId={business.id} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Administradores
          </h2>
          <ul className="space-y-1 text-sm text-gray-700">
            {admins?.map((a) => <li key={a.id}>{a.full_name ?? a.id}</li>)}
            {!admins?.length && <li className="text-gray-400">Sin administradores asignados.</li>}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Programas de lealtad
          </h2>
          <ul className="space-y-1 text-sm text-gray-700">
            {programs?.map((p) => (
              <li key={p.id}>
                {p.name}: {p.purchases_required} compras → {p.reward_description}{" "}
                {p.active ? "" : "(inactivo)"}
              </li>
            ))}
            {!programs?.length && <li className="text-gray-400">Sin programa configurado.</li>}
          </ul>
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
