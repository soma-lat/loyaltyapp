import { nunitoApp as nunito } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/PortalHeader";
import { BottomNav } from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null };

  const displayName = profile?.full_name || user?.email || "Socio";

  return (
    <div className={`${nunito.variable} flex min-h-dvh flex-col bg-surface font-nunito text-primary`}>
      <ToastProvider>
        <PortalHeader displayName={displayName} />
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6">
          {children}
        </main>
        <BottomNav />
      </ToastProvider>
    </div>
  );
}
