export type BackendProvider = "local" | "supabase";

export interface BackendConfig {
  provider: BackendProvider;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
  isSupabaseConfigured: boolean;
}

export function getBackendConfig(): BackendConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const requestedProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER?.toLowerCase();
  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  let provider: BackendProvider;

  if (requestedProvider === "supabase") {
    provider = "supabase";
  } else if (requestedProvider === "local") {
    provider = isSupabaseConfigured ? "supabase" : "local";
  } else {
    provider = isSupabaseConfigured ? "supabase" : "local";
  }

  return {
    provider,
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
    isSupabaseConfigured
  };
}
