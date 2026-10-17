import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// SERVER-ONLY route. Looks up an existing user by email and promotes them
// to business_admin for the given business. Uses the Supabase service role
// key — never exposed to the client — and is gated behind a super_admin check.
// Does NOT invite by email: the account must already exist (see CLAUDE.md
// sección 4, reglas para evitar rebotes de correo).
export async function POST(request: Request) {
  const { email, businessId, fullName } = await request.json();

  if (!email || !businessId) {
    return NextResponse.json({ error: "email y businessId son requeridos" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo el super administrador puede hacer esto" }, { status: 403 });
  }

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

  const targetUserId = existing.id;

  const { error: upsertError } = await admin.from("profiles").upsert({
    id: targetUserId,
    full_name: fullName ?? null,
    email: existing.email ?? null,
    role: "business_admin",
    business_id: businessId,
  });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
