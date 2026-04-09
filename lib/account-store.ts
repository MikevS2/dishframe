import { ACCOUNT_STORAGE_KEY, type AccountState, type AccountStore } from "@/lib/account-data";

export function createLocalAccountStore(): AccountStore {
  return {
    load() {
      if (typeof window === "undefined") {
        return null;
      }

      try {
        const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
        if (!stored) {
          return null;
        }

        const parsed = JSON.parse(stored) as AccountState;
        return {
          user: parsed.user ?? null,
          recipes: Array.isArray(parsed.recipes) ? parsed.recipes : []
        };
      } catch {
        return null;
      }
    },
    save(state) {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(state));
    }
  };
}
