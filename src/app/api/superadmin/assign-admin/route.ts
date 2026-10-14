import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// SERVER-ONLY route. Invites (or reuses) a user by email and promotes them
// to business_admin for the given business. Uses the Supabase service role
// key — never exposed to the client — and is gated behind a super_admin check.
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

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName ?? null },
  });

  let targetUserId = invited?.user?.id;

  if (inviteError) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }
    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }
    targetUserId = existing.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "No se pudo determinar el usuario" }, { status: 400 });
  }

  const { error: upsertError } = await admin.from("profiles").upsert({
    id: targetUserId,
    full_name: fullName ?? null,
    role: "business_admin",
    business_id: businessId,
  });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
