import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Singleton pattern - prevent creating multiple clients
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}

// For server-side rendering reset
export function resetClient() {
  browserClient = null;
}
