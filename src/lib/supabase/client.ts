"use client";

import { createBrowserClient } from "@supabase/ssr";

// Not using the generated-from-DB generic here: we don't have the Supabase
// CLI available to produce one, and a hand-written stand-in fights the
// query builder's type inference. Results are typed explicitly at each
// call site instead (see src/lib/types.ts for the shapes).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
