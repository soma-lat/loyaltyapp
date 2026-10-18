import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";
import { PerfilView } from "./PerfilView";
import type { Business } from "@/lib/types";

export default async function PerfilPage() {
  const ctx = await getAdminContext();

  if (!ctx?.businessId) {
    return (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Tu cuenta no tiene un negocio asignado todavía.
      </p>
    );
  }

  if (ctx.role !== "business_admin") {
    return (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        No tienes permiso para ver esta sección.
      </p>
    );
  }

  const businessId = ctx.businessId;
  const supabase = createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  return (
    <div className="space-y-4">
      <PerfilView business={business as Business} />
      <Link href="/admin/empleados" className="text-sm font-bold text-accent underline">
        Gestionar empleados →
      </Link>
    </div>
  );
}
