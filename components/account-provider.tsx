"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { RecipeColorThemeId, RecipeDocument, RecipeLayoutId } from "@/lib/types";
import { getBackendConfig } from "@/lib/backend-config";
import { createLocalAccountStore } from "@/lib/account-store";
import {
  createStoredRecipe,
  deleteRemoteRecipe,
  hydrateAccountState,
  saveRemoteProfile,
  saveRemoteRecipe
} from "@/lib/supabase/account-sync";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface SubscriptionPlan {
  id: "trial" | "starter" | "plus" | "unlimited";
  name: string;
  priceLabel: string;
  description: string;
  generationLimit: number | null;
  includesProLayouts: boolean;
  badge?: string;
}

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  planId: SubscriptionPlan["id"];
  generationsUsed: number;
}

export interface StoredRecipe {
  id: string;
  title: string;
  savedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  totalTimeMinutes: number | null;
  recipe: RecipeDocument;
}

interface AccountState {
  user: AccountUser | null;
  recipes: StoredRecipe[];
}

interface AccountContextValue {
  user: AccountUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  plans: SubscriptionPlan[];
  activePlan: SubscriptionPlan;
  recipes: StoredRecipe[];
  remainingGenerationsLabel: string;
  hasProLayouts: boolean;
  canGenerate: boolean;
  signIn: (name: string, email: string, password?: string) => Promise<string | null> | string | null;
  signUp: (name: string, email: string, password: string) => Promise<string | null> | string | null;
  sendMagicLink: (email: string) => Promise<string | null> | string | null;
  signOut: () => Promise<void> | void;
  changePlan: (planId: SubscriptionPlan["id"]) => void;
  consumeGeneration: () => boolean;
  saveRecipe: (recipe: RecipeDocument) => string | null;
  updateRecipeCategory: (id: string, category: string) => void;
  updateRecipePresentation: (
    id: string,
    layoutId: RecipeLayoutId,
    colorThemeId?: RecipeColorThemeId
  ) => void;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => StoredRecipe | undefined;
}

const STORAGE_KEY = "recept-in-beeld-account";

const PLANS: SubscriptionPlan[] = [
  {
    id: "trial",
    name: "Gratis proef",
    priceLabel: "€0",
    description: "5 gratis receptgeneraties om de app rustig te testen.",
    generationLimit: 5,
    includesProLayouts: false,
    badge: "Proef"
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "€3 p/m",
    description: "100 receptgeneraties per maand.",
    generationLimit: 100,
    includesProLayouts: false
  },
  {
    id: "plus",
    name: "Plus",
    priceLabel: "€6 p/m",
    description: "300 receptgeneraties per maand.",
    generationLimit: 300,
    includesProLayouts: true
  },
  {
    id: "unlimited",
    name: "Onbeperkt",
    priceLabel: "€10 p/m",
    description: "Onbeperkt recepten genereren en opslaan.",
    generationLimit: null,
    includesProLayouts: true,
    badge: "Meest gekozen"
  }
];

const AccountContext = createContext<AccountContextValue | null>(null);

function getPlan(planId: SubscriptionPlan["id"] | undefined) {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[0];
}

function formatNow() {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function normalizeCategory(value: string | undefined) {
  if (!value?.trim()) {
    return "diner";
  }

  const normalized = value.trim().toLowerCase();
  if (["ontbijt", "lunch", "diner", "snack"].includes(normalized)) {
    return normalized;
  }

  return "diner";
}

function parseMinutes(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const match = value.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  return Number.isNaN(minutes) ? null : minutes;
}

function isStrongEnoughPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

function inferRecipeTags(recipe: RecipeDocument, category: string) {
  const haystack = `${recipe.title} ${recipe.ingredients.map((item) => item.name).join(" ")}`
    .toLowerCase()
    .trim();
  const tags = new Set<string>([category]);

  if (/(kip|chicken)/.test(haystack)) tags.add("kip");
  if (/(vis|zalm|tonijn|kabeljauw|garnalen|shrimp|zalmfilet)/.test(haystack)) tags.add("vis");
  if (/(rund|biefstuk|gehakt|beef|ribeye)/.test(haystack)) tags.add("rund");
  if (/(varken|bacon|ham|spek|worst|procureur|karbonade)/.test(haystack)) tags.add("varken");
  if (
    !/(kip|chicken|vis|zalm|tonijn|kabeljauw|garnalen|shrimp|rund|biefstuk|gehakt|beef|varken|bacon|ham|spek|worst|karbonade)/.test(
      haystack
    )
  ) {
    tags.add("vega");
  }
  if (/(pasta|spaghetti|penne|fusilli|lasagne)/.test(haystack)) tags.add("pasta");
  if (/(rijst|noedels|curry|stoof|ovenschotel)/.test(haystack)) tags.add("warm");
  if (/(salade|smoothie|shake|bowl|wrap)/.test(haystack)) tags.add("licht");

  return Array.from(tags);
}

function inferTotalTimeMinutes(recipe: RecipeDocument) {
  const prep = parseMinutes(recipe.prepTime) ?? 0;
  const cook = parseMinutes(recipe.cookTime) ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}

function mapSupabaseUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AccountUser {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";

  return {
    id: user.id,
    name: metadataName || user.email?.split("@")[0] || "Gebruiker",
    email: user.email ?? "",
    planId: "trial",
    generationsUsed: 0
  };
}

function createLocalUser(name: string, email: string, currentUser?: AccountUser | null): AccountUser {
  return {
    id: currentUser?.id ?? `user-${Date.now()}`,
    name: name.trim() || currentUser?.name || "Nieuwe gebruiker",
    email: email.trim() || currentUser?.email || "gebruiker@dishframe.nl",
    planId: currentUser?.planId ?? "trial",
    generationsUsed: currentUser?.generationsUsed ?? 0
  };
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const backendConfig = useMemo(() => getBackendConfig(), []);
  const localStore = useMemo(() => createLocalAccountStore(), []);
  const supabase = useMemo(
    () =>
      backendConfig.provider === "supabase" && backendConfig.isSupabaseConfigured
        ? createSupabaseBrowserClient()
        : null,
    [backendConfig]
  );
  const [state, setState] = useState<AccountState>({ user: null, recipes: [] });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const stored = localStore.load();
    setState(stored ?? { user: null, recipes: [] });
    setHasLoaded(true);
  }, [localStore]);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      if (!data.session?.user) {
        setState({ user: null, recipes: [] });
        setIsAuthLoading(false);
        return;
      }

      const localState = localStore.load() ?? { user: null, recipes: [] };

      hydrateAccountState(supabase, data.session.user, localState).then(async (hydratedState) => {
        if (!isMounted) {
          return;
        }

        if (hydratedState?.user) {
          setState(hydratedState);
          await saveRemoteProfile(supabase, hydratedState.user);
          localStore.save({ user: null, recipes: [] });
        } else {
          setState({
            user: createLocalUser(
              typeof data.session.user.user_metadata?.full_name === "string"
                ? data.session.user.user_metadata.full_name
                : "",
              data.session.user.email ?? "",
              localState.user
            ),
            recipes: localState.recipes
          });
        }

        setIsAuthLoading(false);
      });
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setState({ user: null, recipes: [] });
        setIsAuthLoading(false);
        return;
      }

      const localState = localStore.load() ?? { user: null, recipes: [] };

      hydrateAccountState(supabase, session.user, localState).then(async (hydratedState) => {
        if (!isMounted) {
          return;
        }

        if (hydratedState?.user) {
          setState(hydratedState);
          await saveRemoteProfile(supabase, hydratedState.user);
          localStore.save({ user: null, recipes: [] });
        } else {
          setState({
            user: createLocalUser(
              typeof session.user.user_metadata?.full_name === "string"
                ? session.user.user_metadata.full_name
                : "",
              session.user.email ?? "",
              localState.user
            ),
            recipes: localState.recipes
          });
        }

        setIsAuthLoading(false);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [localStore, supabase]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    if (supabase) {
      if (!state.user) {
        localStore.save({ user: null, recipes: [] });
      }
      return;
    }

    localStore.save(state);
  }, [hasLoaded, localStore, state, supabase]);

  const activePlan = getPlan(state.user?.planId);
  const remainingGenerations =
    activePlan.generationLimit === null
      ? null
      : Math.max(activePlan.generationLimit - (state.user?.generationsUsed ?? 0), 0);

  function getAuthRedirectUrl() {
    const configuredUrl = backendConfig.appUrl.trim();

    if (configuredUrl) {
      return configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`;
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}/`;
    }

    return undefined;
  }

  const value = useMemo<AccountContextValue>(
    () => ({
      user: state.user,
      isAuthenticated: Boolean(state.user),
      isAuthLoading,
      plans: PLANS,
      activePlan,
      recipes: state.recipes,
      remainingGenerationsLabel:
        activePlan.generationLimit === null
          ? "Onbeperkt beschikbaar"
          : `${remainingGenerations} van ${activePlan.generationLimit} generaties over`,
      hasProLayouts: activePlan.includesProLayouts,
      canGenerate: Boolean(state.user) && (remainingGenerations === null || remainingGenerations > 0),
      signIn: async (name, email, password) => {
        if (supabase) {
          if (!password) {
            return "Vul ook een wachtwoord in.";
          }

          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });

          return error ? error.message : null;
        }

        setState((current) => ({
          ...current,
          user: createLocalUser(name, email, current.user)
        }));
        return null;
      },
      signUp: async (name, email, password) => {
        if (!isStrongEnoughPassword(password)) {
          return "Gebruik minimaal 8 tekens met ten minste 1 letter en 1 cijfer.";
        }

        if (supabase) {
          const redirectTo = getAuthRedirectUrl();

          const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: {
                full_name: name.trim()
              }
            }
          });

          return error ? error.message : null;
        }

        setState((current) => ({
          ...current,
          user: createLocalUser(name, email, current.user)
        }));
        return null;
      },
      sendMagicLink: async (email) => {
        if (!supabase) {
          return "E-mail login is pas beschikbaar zodra Supabase actief is.";
        }

        const redirectTo = getAuthRedirectUrl();

        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: redirectTo
          }
        });

        return error ? error.message : null;
      },
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }

        setState({ user: null, recipes: [] });
      },
      changePlan: (planId) => {
        if (!state.user) {
          return;
        }

        const nextUser = {
          ...state.user,
          planId,
          generationsUsed: 0
        };

        setState((current) => ({
          ...current,
          user: nextUser
        }));

        if (supabase) {
          void saveRemoteProfile(supabase, nextUser);
        }
      },
      consumeGeneration: () => {
        if (!state.user) {
          return false;
        }

        if (remainingGenerations !== null && remainingGenerations <= 0) {
          return false;
        }

        const nextUser = {
          ...state.user,
          generationsUsed: state.user.generationsUsed + 1
        };

        setState((current) => ({
          ...current,
          user: nextUser
        }));

        if (supabase) {
          void saveRemoteProfile(supabase, nextUser);
        }
        return true;
      },
      saveRecipe: (recipe) => {
        if (!state.user) {
          return null;
        }

        const entry = createStoredRecipe(recipe);

        setState((current) => ({
          ...current,
          recipes: [entry, ...current.recipes]
        }));

        if (supabase) {
          void saveRemoteRecipe(supabase, state.user.id, entry);
        }

        return entry.id;
      },
      updateRecipeCategory: (id, category) => {
        const normalized = normalizeCategory(category);
        const targetRecipe = state.recipes.find((recipe) => recipe.id === id);

        setState((current) => ({
          ...current,
          recipes: current.recipes.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  category: normalized,
                  updatedAt: formatNow(),
                  tags: inferRecipeTags(recipe.recipe, normalized),
                  recipe: {
                    ...recipe.recipe,
                    mealType: normalized
                  }
                }
              : recipe
          )
        }));

        if (supabase && state.user && targetRecipe) {
          const syncedRecipe: StoredRecipe = {
            ...targetRecipe,
            category: normalized,
            updatedAt: formatNow(),
            tags: inferRecipeTags(targetRecipe.recipe, normalized),
            recipe: {
              ...targetRecipe.recipe,
              mealType: normalized
            }
          };

          void saveRemoteRecipe(supabase, state.user.id, syncedRecipe);
        }
      },
      updateRecipePresentation: (id, layoutId, colorThemeId) => {
        const targetRecipe = state.recipes.find((recipe) => recipe.id === id);

        setState((current) => ({
          ...current,
          recipes: current.recipes.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  updatedAt: formatNow(),
                  recipe: {
                    ...recipe.recipe,
                    layoutId,
                    colorThemeId
                  }
                }
              : recipe
          )
        }));

        if (supabase && state.user && targetRecipe) {
          const syncedRecipe: StoredRecipe = {
            ...targetRecipe,
            updatedAt: formatNow(),
            recipe: {
              ...targetRecipe.recipe,
              layoutId,
              colorThemeId
            }
          };

          void saveRemoteRecipe(supabase, state.user.id, syncedRecipe);
        }
      },
      deleteRecipe: (id) => {
        setState((current) => ({
          ...current,
          recipes: current.recipes.filter((recipe) => recipe.id !== id)
        }));

        if (supabase && state.user) {
          void deleteRemoteRecipe(supabase, state.user.id, id);
        }
      },
      getRecipeById: (id) => state.recipes.find((recipe) => recipe.id === id)
    }),
    [activePlan, backendConfig.appUrl, isAuthLoading, remainingGenerations, state.recipes, state.user, supabase]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used within AccountProvider.");
  }

  return context;
}
