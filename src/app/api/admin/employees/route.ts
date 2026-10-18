import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// SERVER-ONLY route. A business_admin invites/removes employees of their OWN
// business. Does NOT invite by email: the account must already exist (ver
// CLAUDE.md sección 4). Uses the service role key because profiles.role y
// business_id están protegidos por el trigger prevent_profile_privilege_escalation
// y un business_admin normal no puede escribirlos directamente.
async function requireBusinessAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, business_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "business_admin" || !profile.business_id) {
    return { error: NextResponse.json({ error: "Solo el administrador del negocio puede hacer esto" }, { status: 403 }) };
  }

  return { businessId: profile.business_id as string };
}

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "email es requerido" }, { status: 400 });
  }

  const auth = await requireBusinessAdmin();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    return NextResponse.json(
      { error: "No existe una cuenta con ese correo. Pide que se registre primero en /login y vuelve a intentarlo." },
      { status: 400 }
    );
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role, business_id")
    .eq("id", existing.id)
    .single();

  if (targetProfile?.role === "super_admin" || targetProfile?.role === "business_admin") {
    return NextResponse.json({ error: "Esa cuenta ya tiene un rol administrativo, no se puede convertir en empleado." }, { status: 400 });
  }

  if (targetProfile?.role === "employee" && targetProfile.business_id !== auth.businessId) {
    return NextResponse.json({ error: "Esa cuenta ya es empleado de otro negocio." }, { status: 400 });
  }

  const { error: upsertError } = await admin
    .from("profiles")
    .update({ role: "employee", business_id: auth.businessId })
    .eq("id", existing.id);

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { employeeId } = await request.json();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId es requerido" }, { status: 400 });
  }

  const auth = await requireBusinessAdmin();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role, business_id")
    .eq("id", employeeId)
    .single();

  if (targetProfile?.role !== "employee" || targetProfile.business_id !== auth.businessId) {
    return NextResponse.json({ error: "Esa cuenta no es un empleado de tu negocio." }, { status: 400 });
  }

  const { error } = await admin.from("profiles").update({ role: "customer", business_id: null }).eq("id", employeeId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
