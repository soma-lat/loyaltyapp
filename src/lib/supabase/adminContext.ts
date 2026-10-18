import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function getAdminContext(): Promise<{ businessId: string | null; role: Role } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { businessId: profile.business_id, role: profile.role };
}
