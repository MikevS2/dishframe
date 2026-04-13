export type BackendProvider = "local" | "supabase";

export interface BackendConfig {
  provider: BackendProvider;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
  isSupabaseConfigured: boolean;
}

function normalizeValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function isValidHttpUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getBackendConfig(): BackendConfig {
  const supabaseUrl = normalizeValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const appUrl = normalizeValue(process.env.NEXT_PUBLIC_APP_URL);
  const requestedProvider = normalizeValue(process.env.NEXT_PUBLIC_BACKEND_PROVIDER).toLowerCase();
  const isSupabaseConfigured = isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey);

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
