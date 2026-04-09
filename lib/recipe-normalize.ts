import type { IngredientItem, NormalizeRecipeRequest, RecipeDocument } from "@/lib/types";
import { normalizeUnit } from "@/lib/recipe-units";

const PRODUCE_UNIT_HINTS = [
  "avocado",
  "kiwi",
  "banaan",
  "appel",
  "peer",
  "citroen",
  "limoen",
  "sinaasappel",
  "mango",
  "paprika",
  "courgette",
  "komkommer",
  "tomaat",
  "ui"
];

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanLine(line: string) {
  return line.replace(/^[\-\d.)\s]+/, "").trim();
}

function normalizeIngredient(item: Partial<IngredientItem>): IngredientItem {
  return {
    id: item.id ?? randomId("ing"),
    name: (item.name ?? "").trim(),
    amount: (item.amount ?? "").trim(),
    unit: normalizeUnit(item.unit ?? "")
  };
}

function rewriteInstruction(line: string) {
  const cleaned = cleanLine(line);
  if (!cleaned) {
    return "";
  }

  const sentence = cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function rewriteInstructionsConsistently(instructions: string[]) {
  return instructions.map(rewriteInstruction).filter(Boolean);
}

function parseIngredientLine(line: string): IngredientItem {
  const trimmed = cleanLine(line);
  const match = trimmed.match(
    /^(?<amount>\d+(?:[.,]\d+)?(?:\/\d+)?)?\s*(?<unit>g|gr|kg|ml|l|el|eetlepel|eetlepels|tl|theelepel|theelepels|st|stuk|stuks|hand|handen|schep|scheppen|snuf|snufje|kop|kopje|teen|tenen)?\s*(?<name>.+)$/i
  );

  if (!match?.groups) {
    return normalizeIngredient({ name: trimmed });
  }

  return normalizeIngredient({
    amount: match.groups.amount ?? "",
    unit: match.groups.unit ?? "",
    name: match.groups.name ?? trimmed
  });
}

function maybeAddPieceUnit(recipe: RecipeDocument): RecipeDocument {
  const ingredients = recipe.ingredients.map((item) => {
    const name = item.name.toLowerCase();
    const hasProduceHint = PRODUCE_UNIT_HINTS.some((hint) => name.includes(hint));
    const hasAmount = Boolean(item.amount);
    const hasUnit = Boolean(item.unit);

    if (hasAmount && !hasUnit && hasProduceHint) {
      return {
        ...item,
        unit: "stuk"
      };
    }

    return item;
  });

  return {
    ...recipe,
    ingredients
  };
}

function fixInstructionConflicts(recipe: RecipeDocument): RecipeDocument {
  const ingredientNames = recipe.ingredients.map((item) => item.name.toLowerCase());
  const keepsKiwiPeel = ingredientNames.some((name) => name.includes("kiwi met schil"));
  const keepsCucumberPeel = ingredientNames.some((name) => name.includes("komkommer met schil"));

  const instructions = recipe.instructions.map((instruction) => {
    let nextInstruction = instruction;

    if (keepsKiwiPeel && /schil de kiwi/i.test(nextInstruction)) {
      nextInstruction = nextInstruction.replace(/schil de kiwi/gi, "Snijd de kiwi");
    }

    if (keepsCucumberPeel && /schil de komkommer/i.test(nextInstruction)) {
      nextInstruction = nextInstruction.replace(/schil de komkommer/gi, "Snijd de komkommer");
    }

    return rewriteInstruction(nextInstruction);
  });

  return {
    ...recipe,
    instructions
  };
}

function parseAmountValue(amount: string) {
  const cleaned = amount.trim().replace(",", ".");
  if (!cleaned) {
    return null;
  }

  if (cleaned.includes("/")) {
    const [numerator, denominator] = cleaned.split("/");
    const num = Number(numerator);
    const den = Number(denominator);

    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return num / den;
    }
  }

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

function estimateServings(recipe: RecipeDocument) {
  const explicitServings = recipe.servings?.trim();
  if (explicitServings) {
    return explicitServings;
  }

  const haystack = `${recipe.title} ${recipe.ingredients.map((item) => item.name).join(" ")}`
    .toLowerCase()
    .trim();

  const isDrinkLike = /(shake|smoothie|sap|drank|latte)/.test(haystack);
  if (isDrinkLike) {
    let totalMl = 0;

    for (const ingredient of recipe.ingredients) {
      const amount = parseAmountValue(ingredient.amount);
      if (amount === null) {
        continue;
      }

      if (ingredient.unit === "ml") {
        totalMl += amount;
      }

      if (ingredient.unit === "l") {
        totalMl += amount * 1000;
      }

      if (ingredient.unit === "ml" || ingredient.unit === "l") {
        continue;
      }

      if (
        /(kefir|melk|yoghurt|skyr|kwark|sap|water|kokoswater|amandelmelk|havermelk)/.test(
          ingredient.name.toLowerCase()
        )
      ) {
        totalMl += amount * 0.9;
      }
    }

    if (totalMl >= 700) {
      return "3";
    }

    if (totalMl >= 350) {
      return "2";
    }

    return "1";
  }

  if (recipe.ingredients.length <= 5) {
    return "2";
  }

  if (recipe.ingredients.length <= 10) {
    return "4";
  }

  return "6";
}

function estimateMealType(recipe: RecipeDocument) {
  const explicitMealType = recipe.mealType?.trim().toLowerCase();
  if (explicitMealType) {
    return explicitMealType;
  }

  const haystack = `${recipe.title} ${recipe.ingredients.map((item) => item.name).join(" ")} ${recipe.instructions.join(" ")}`
    .toLowerCase()
    .trim();

  if (/(smoothie|shake|yoghurt|granola|havermout|overnight oats|ontbijt)/.test(haystack)) {
    return "ontbijt";
  }

  if (/(salade|wrap|sandwich|broodje|tosti|soep|lunch)/.test(haystack)) {
    return "lunch";
  }

  if (/(cake|muffin|koek|brownie|reep|snack|dip|spread)/.test(haystack)) {
    return "snack";
  }

  return "diner";
}

function estimatePrepTime(recipe: RecipeDocument) {
  const explicitPrepTime = recipe.prepTime?.trim();
  if (explicitPrepTime) {
    return explicitPrepTime;
  }

  const haystack = `${recipe.title} ${recipe.ingredients.map((item) => item.name).join(" ")}`
    .toLowerCase()
    .trim();

  if (/(shake|smoothie|salade|dip|spread)/.test(haystack)) {
    return "10 min";
  }

  if (recipe.ingredients.length <= 5) {
    return "10 min";
  }

  if (recipe.ingredients.length <= 10) {
    return "15 min";
  }

  return "20 min";
}

function estimateCookTime(recipe: RecipeDocument) {
  const explicitCookTime = recipe.cookTime?.trim();
  if (explicitCookTime) {
    return explicitCookTime;
  }

  const haystack = `${recipe.title} ${recipe.instructions.join(" ")}`
    .toLowerCase()
    .trim();

  if (/(shake|smoothie|salade|dip|spread)/.test(haystack)) {
    return "0 min";
  }

  if (/(oven|bak|bakken|grill|rooster)/.test(haystack)) {
    return "25 min";
  }

  if (/(kook|koken|sudder|stoof)/.test(haystack)) {
    return "20 min";
  }

  if (/(wok|roerbak|bak de)/.test(haystack)) {
    return "12 min";
  }

  return "10 min";
}

function finalizeRecipe(recipe: RecipeDocument): RecipeDocument {
  const recipeWithUnits = maybeAddPieceUnit({
    ...recipe,
    instructions: rewriteInstructionsConsistently(recipe.instructions)
  });
  const conflictSafeRecipe = fixInstructionConflicts(recipeWithUnits);

  return {
    ...conflictSafeRecipe,
    servings: estimateServings(conflictSafeRecipe),
    mealType: estimateMealType(conflictSafeRecipe),
    prepTime: estimatePrepTime(conflictSafeRecipe),
    cookTime: estimateCookTime(conflictSafeRecipe)
  };
}

function splitSections(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? "Onbenoemd recept";
  const lowerLines = lines.map((line) => line.toLowerCase());
  const ingredientsIndex = lowerLines.findIndex((line) =>
    /(ingrediënten|ingredienten)/.test(line)
  );
  const preparationIndex = lowerLines.findIndex((line) =>
    /(bereiding|instructies|werkwijze)/.test(line)
  );

  const firstLineIsSectionHeader = /(ingredienten|ingrediënten|bereiding|instructies|werkwijze)/i.test(
    firstLine
  );
  const title = firstLineIsSectionHeader ? "Onbenoemd recept" : firstLine;
  const ingredientLines =
    ingredientsIndex >= 0 && preparationIndex > ingredientsIndex
      ? lines.slice(ingredientsIndex + 1, preparationIndex)
      : lines.slice(firstLineIsSectionHeader ? 0 : 1, Math.max(lines.length - 3, 1));

  const instructionLines =
    preparationIndex >= 0
      ? lines.slice(preparationIndex + 1)
      : lines.slice(Math.max(lines.length - 3, 1));

  return {
    title,
    ingredientLines: ingredientLines.filter((line) => !/(ingrediënten|ingredienten)/i.test(line)),
    instructionLines: instructionLines.filter((line) => !/(bereiding|instructies|werkwijze)/i.test(line))
  };
}

export function fallbackNormalizeRecipe(payload: NormalizeRecipeRequest): RecipeDocument {
  if (payload.inputMode === "form" && payload.draft) {
    return finalizeRecipe({
      title: payload.draft.title.trim() || "Onbenoemd recept",
      servings: payload.draft.servings?.trim() || "",
      mealType: payload.draft.mealType?.trim() || "",
      prepTime: payload.draft.prepTime?.trim() || "",
      cookTime: payload.draft.cookTime?.trim() || "",
      ingredients: payload.draft.ingredients
        .map(normalizeIngredient)
        .filter((item) => item.name),
      instructions: payload.draft.instructions.map(rewriteInstruction).filter(Boolean),
      imageMode: "generated",
      layoutId: "atelier"
    });
  }

  const sections = splitSections(payload.rawText ?? "");

  return finalizeRecipe({
    title: sections.title,
    servings: "",
    mealType: "",
    prepTime: "",
    cookTime: "",
    ingredients: sections.ingredientLines.map(parseIngredientLine).filter((item) => item.name),
    instructions: sections.instructionLines.map(rewriteInstruction).filter(Boolean),
    imageMode: "generated",
    layoutId: "atelier"
  });
}

export function sanitizeModelRecipe(parsed: unknown): RecipeDocument {
  const data = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  const rawIngredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const rawInstructions = Array.isArray(data.instructions) ? data.instructions : [];

  return finalizeRecipe({
    title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Onbenoemd recept",
    servings: typeof data.servings === "string" ? data.servings.trim() : "",
    mealType: typeof data.mealType === "string" ? data.mealType.trim() : "",
    prepTime: typeof data.prepTime === "string" ? data.prepTime.trim() : "",
    cookTime: typeof data.cookTime === "string" ? data.cookTime.trim() : "",
    ingredients: rawIngredients
      .map((entry) => {
        const ingredient = entry as Record<string, unknown>;
        return normalizeIngredient({
          name: typeof ingredient.name === "string" ? ingredient.name : "",
          amount: typeof ingredient.amount === "string" ? ingredient.amount : "",
          unit: typeof ingredient.unit === "string" ? ingredient.unit : ""
        });
      })
      .filter((entry) => entry.name),
    instructions: rawInstructions
      .map((item) => (typeof item === "string" ? rewriteInstruction(item) : ""))
      .filter(Boolean),
    imageMode: "generated",
    layoutId: "atelier"
  });
}

export function validateRecipe(recipe: RecipeDocument) {
  if (!recipe.title.trim()) {
    return "Voeg een recepttitel toe.";
  }

  if (!recipe.ingredients.length) {
    return "Voeg minimaal een ingredient toe.";
  }

  if (!recipe.instructions.length) {
    return "Voeg minimaal een bereidingsstap toe.";
  }

  return null;
}
