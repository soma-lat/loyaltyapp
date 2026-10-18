import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/adminContext";

function csvField(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx?.businessId || ctx.role !== "business_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createClient();
  let query = supabase
    .from("transactions")
    .select("created_at, type, amount, note, profiles:customer_id(full_name), loyalty_programs:loyalty_program_id(name)")
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999`);

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const header = ["Fecha", "Tipo", "Cliente", "Promoción", "Nota", "Monto"].join(",");
  const lines = (rows ?? []).map((r: any) =>
    [
      csvField(new Date(r.created_at).toLocaleString("es-MX")),
      csvField(r.type === "purchase" ? "Compra" : "Canje"),
      csvField(r.profiles?.full_name ?? ""),
      csvField(r.loyalty_programs?.name ?? ""),
      csvField(r.note ?? ""),
      csvField(r.amount ?? ""),
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movimientos.csv"`,
    },
  });
}
