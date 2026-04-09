import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { getBackendConfig } from "@/lib/backend-config";

export async function createSupabaseServerClient() {
  const config = getBackendConfig();
  const cookieStore = await cookies();

  if (!config.isSupabaseConfigured) {
    return null;
  }

  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
