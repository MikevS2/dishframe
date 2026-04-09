import type { RecipeColorThemeId, RecipeDocument, RecipeLayoutId } from "@/lib/types";

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

export interface AccountState {
  user: AccountUser | null;
  recipes: StoredRecipe[];
}

export interface AccountStore {
  load(): AccountState | null;
  save(state: AccountState): void;
}

export interface AccountContextValue {
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

export const ACCOUNT_STORAGE_KEY = "recept-in-beeld-account";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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

export function getSubscriptionPlan(planId: SubscriptionPlan["id"] | undefined) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? SUBSCRIPTION_PLANS[0];
}

export function formatAccountTimestamp() {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

export function normalizeRecipeCategory(value: string | undefined) {
  if (!value?.trim()) {
    return "diner";
  }

  const normalized = value.trim().toLowerCase();
  if (["ontbijt", "lunch", "diner", "snack"].includes(normalized)) {
    return normalized;
  }

  return "diner";
}

export function parseMinutes(value: string | undefined) {
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

export function inferRecipeTags(recipe: RecipeDocument, category: string) {
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

export function inferTotalTimeMinutes(recipe: RecipeDocument) {
  const prep = parseMinutes(recipe.prepTime) ?? 0;
  const cook = parseMinutes(recipe.cookTime) ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}
