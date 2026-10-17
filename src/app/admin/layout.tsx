import { Nunito } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { ToastProvider } from "@/components/Toast";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, business_id").eq("id", user.id).single()
    : { data: null };

  const { data: business } = profile?.business_id
    ? await supabase.from("businesses").select("name").eq("id", profile.business_id).single()
    : { data: null };

  const displayName = profile?.full_name || user?.email || "Admin";
  const businessName = business?.name ?? "Panel de negocio";

  return (
    <div className={`${nunito.variable} flex min-h-dvh flex-col bg-surface font-nunito text-primary`}>
      <ToastProvider>
        <AdminHeader businessName={businessName} displayName={displayName} />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6">
          {children}
        </main>
        <AdminBottomNav />
      </ToastProvider>
    </div>
  );
}
