import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AccountState, AccountUser, StoredRecipe, SubscriptionPlan } from "@/lib/account-data";
import {
  formatAccountTimestamp,
  getSubscriptionPlan,
  inferRecipeTags,
  inferTotalTimeMinutes,
  normalizeRecipeCategory
} from "@/lib/account-data";
import type { RecipeDocument } from "@/lib/types";

type BrowserSupabaseClient = SupabaseClient;

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  active_plan: SubscriptionPlan["id"] | null;
  generations_used: number | null;
};

type RecipeRow = {
  id: string;
  title: string;
  category: string;
  tags: string[] | null;
  total_time_minutes: number | null;
  recipe_json: RecipeDocument;
  created_at: string | null;
  updated_at: string | null;
};

function mapAuthUser(user: User): AccountUser {
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

function mapProfileRow(row: ProfileRow | null | undefined, authUser: User): AccountUser {
  const fallbackUser = mapAuthUser(authUser);

  if (!row) {
    return fallbackUser;
  }

  const plan = getSubscriptionPlan(row.active_plan ?? fallbackUser.planId);

  return {
    id: row.id,
    name: row.full_name || fallbackUser.name,
    email: row.email || fallbackUser.email,
    planId: plan.id,
    generationsUsed: row.generations_used ?? 0
  };
}

function formatStoredTimestamp(value: string | null | undefined) {
  if (!value) {
    return formatAccountTimestamp();
  }

  try {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return formatAccountTimestamp();
  }
}

export function mapRecipeRow(row: RecipeRow): StoredRecipe {
  return {
    id: row.id,
    title: row.title,
    savedAt: formatStoredTimestamp(row.created_at),
    updatedAt: formatStoredTimestamp(row.updated_at),
    category: normalizeRecipeCategory(row.category),
    tags: Array.isArray(row.tags) ? row.tags : [],
    totalTimeMinutes: row.total_time_minutes,
    recipe: row.recipe_json
  };
}

function createRecipeRow(userId: string, entry: StoredRecipe) {
  return {
    id: entry.id,
    user_id: userId,
    title: entry.title,
    category: entry.category,
    tags: entry.tags,
    total_time_minutes: entry.totalTimeMinutes,
    recipe_json: entry.recipe,
    updated_at: new Date().toISOString()
  };
}

export async function ensureRemoteProfile(
  client: BrowserSupabaseClient,
  user: User
): Promise<AccountUser | null> {
  const fallbackUser = mapAuthUser(user);

  const { data, error } = await client
    .from("profiles")
    .select("id, email, full_name, active_plan, generations_used")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (data) {
    return mapProfileRow(data as ProfileRow, user);
  }

  const insertPayload = {
    id: user.id,
    email: user.email ?? fallbackUser.email,
    full_name: fallbackUser.name,
    active_plan: "trial" as const,
    generations_used: 0
  };

  const insertResult = await client
    .from("profiles")
    .insert(insertPayload)
    .select("id, email, full_name, active_plan, generations_used")
    .single();

  if (insertResult.error) {
    return null;
  }

  return mapProfileRow(insertResult.data as ProfileRow, user);
}

export async function loadRemoteRecipes(
  client: BrowserSupabaseClient,
  userId: string
): Promise<StoredRecipe[] | null> {
  const { data, error } = await client
    .from("recipes")
    .select("id, title, category, tags, total_time_minutes, recipe_json, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return null;
  }

  return (data as RecipeRow[]).map(mapRecipeRow);
}

export async function saveRemoteProfile(
  client: BrowserSupabaseClient,
  user: AccountUser
): Promise<boolean> {
  const { error } = await client.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: user.name,
      active_plan: user.planId,
      generations_used: user.generationsUsed
    },
    { onConflict: "id" }
  );

  return !error;
}

export async function saveRemoteRecipe(
  client: BrowserSupabaseClient,
  userId: string,
  entry: StoredRecipe
): Promise<boolean> {
  const { error } = await client
    .from("recipes")
    .upsert(createRecipeRow(userId, entry), { onConflict: "id" });

  return !error;
}

export async function deleteRemoteRecipe(
  client: BrowserSupabaseClient,
  userId: string,
  recipeId: string
): Promise<boolean> {
  const { error } = await client.from("recipes").delete().eq("user_id", userId).eq("id", recipeId);
  return !error;
}

export async function syncLocalRecipesToRemote(
  client: BrowserSupabaseClient,
  userId: string,
  recipes: StoredRecipe[]
): Promise<boolean> {
  if (!recipes.length) {
    return true;
  }

  const rows = recipes.map((entry) => createRecipeRow(userId, entry));
  const { error } = await client.from("recipes").upsert(rows, { onConflict: "id" });
  return !error;
}

export function createStoredRecipe(recipe: RecipeDocument): StoredRecipe {
  const id = `recipe-${Date.now()}`;
  const timestamp = formatAccountTimestamp();
  const category = normalizeRecipeCategory(recipe.mealType);

  return {
    id,
    title: recipe.title,
    savedAt: timestamp,
    updatedAt: timestamp,
    category,
    tags: inferRecipeTags(recipe, category),
    totalTimeMinutes: inferTotalTimeMinutes(recipe),
    recipe: {
      ...recipe,
      mealType: category
    }
  };
}

export async function hydrateAccountState(
  client: BrowserSupabaseClient,
  authUser: User,
  localState: AccountState
): Promise<AccountState | null> {
  const remoteUser = await ensureRemoteProfile(client, authUser);
  if (!remoteUser) {
    return null;
  }

  if (localState.recipes.length) {
    await syncLocalRecipesToRemote(client, authUser.id, localState.recipes);
  }

  const remoteRecipes = await loadRemoteRecipes(client, authUser.id);
  if (remoteRecipes === null) {
    return null;
  }

  return {
    user: remoteUser,
    recipes: remoteRecipes
  };
}
