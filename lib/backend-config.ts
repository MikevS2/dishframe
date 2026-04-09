export type BackendProvider = "local" | "supabase";

export interface BackendConfig {
  provider: BackendProvider;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
}

export function getBackendConfig(): BackendConfig {
  const provider = (process.env.NEXT_PUBLIC_BACKEND_PROVIDER as BackendProvider | undefined) ?? "local";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return {
    provider,
    supabaseUrl,
    supabaseAnonKey,
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey)
  };
}
