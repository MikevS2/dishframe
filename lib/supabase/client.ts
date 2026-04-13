import { createBrowserClient } from "@supabase/ssr";
import { getBackendConfig } from "@/lib/backend-config";

export function createSupabaseBrowserClient() {
  const config = getBackendConfig();

  if (!config.isSupabaseConfigured) {
    return null;
  }

  try {
    return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
  } catch {
    return null;
  }
}
