import type { IngredientItem, NormalizeRecipeRequest, RecipeDocument, RecipeMacros } from "@/lib/types";
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

const VAGUE_AMOUNT_ESTIMATES: Array<{
  matcher: RegExp;
  amount: string;
  unit: string;
}> = [
  { matcher: /olijfolie|olie/, amount: "1", unit: "theelepel" },
  { matcher: /zout|peper|chilivlokken|knoflookpoeder|paprikapoeder/, amount: "1", unit: "snuf" }
];

type NutritionProfile = {
  matcher: RegExp;
  baseAmount: number;
  baseUnit: "g" | "ml" | "stuk";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  pieceWeight?: number;
};

const NUTRITION_PROFILES: NutritionProfile[] = [
  { matcher: /zalm|salmon/, baseAmount: 100, baseUnit: "g", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { matcher: /kip|chicken/, baseAmount: 100, baseUnit: "g", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { matcher: /rund|biefstuk|gehakt/, baseAmount: 100, baseUnit: "g", calories: 217, protein: 26, carbs: 0, fat: 12 },
  { matcher: /varken|ham|spek|bacon|worst/, baseAmount: 100, baseUnit: "g", calories: 242, protein: 23, carbs: 0, fat: 17 },
  { matcher: /rijst/, baseAmount: 100, baseUnit: "g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { matcher: /pasta|spaghetti|penne|fusilli|macaroni/, baseAmount: 100, baseUnit: "g", calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { matcher: /aardappel/, baseAmount: 100, baseUnit: "g", calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { matcher: /olijfolie|olie/, baseAmount: 100, baseUnit: "ml", calories: 884, protein: 0, carbs: 0, fat: 100 },
  { matcher: /ui/, baseAmount: 100, baseUnit: "g", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, pieceWeight: 110 },
  { matcher: /knoflook/, baseAmount: 100, baseUnit: "g", calories: 149, protein: 6.4, carbs: 33, fat: 0.5, pieceWeight: 5 },
  { matcher: /prei/, baseAmount: 100, baseUnit: "g", calories: 61, protein: 1.5, carbs: 14, fat: 0.3, pieceWeight: 90 },
  { matcher: /paprika/, baseAmount: 100, baseUnit: "g", calories: 31, protein: 1, carbs: 6, fat: 0.3, pieceWeight: 150 },
  { matcher: /tomatenpuree/, baseAmount: 100, baseUnit: "g", calories: 82, protein: 4.3, carbs: 19, fat: 0.5 },
  { matcher: /tomaat|tomaten/, baseAmount: 100, baseUnit: "g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, pieceWeight: 120 },
  { matcher: /sojasaus/, baseAmount: 100, baseUnit: "ml", calories: 53, protein: 8.1, carbs: 4.9, fat: 0.6 },
  { matcher: /oestersaus/, baseAmount: 100, baseUnit: "ml", calories: 51, protein: 1.4, carbs: 10.9, fat: 0.3 },
  { matcher: /selderij/, baseAmount: 100, baseUnit: "g", calories: 16, protein: 0.7, carbs: 3, fat: 0.2 },
  { matcher: /skyr/, baseAmount: 100, baseUnit: "g", calories: 63, protein: 11, carbs: 3.5, fat: 0.2 },
  { matcher: /kefir/, baseAmount: 100, baseUnit: "ml", calories: 41, protein: 3.4, carbs: 4.8, fat: 1 },
  { matcher: /kwark|yoghurt/, baseAmount: 100, baseUnit: "g", calories: 63, protein: 10, carbs: 3.6, fat: 0.2 },
  { matcher: /avocado/, baseAmount: 100, baseUnit: "g", calories: 160, protein: 2, carbs: 9, fat: 15, pieceWeight: 150 },
  { matcher: /spinazie/, baseAmount: 100, baseUnit: "g", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { matcher: /bes|bessen|blauwe bes|frambo/, baseAmount: 100, baseUnit: "g", calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { matcher: /kiwi/, baseAmount: 100, baseUnit: "g", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, pieceWeight: 75 },
  { matcher: /havermout|oats/, baseAmount: 100, baseUnit: "g", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  { matcher: /chia/, baseAmount: 100, baseUnit: "g", calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  { matcher: /eiwitpoeder|protein/, baseAmount: 100, baseUnit: "g", calories: 400, protein: 80, carbs: 8, fat: 7 },
  { matcher: /broccoli/, baseAmount: 100, baseUnit: "g", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { matcher: /wortel|peen/, baseAmount: 100, baseUnit: "g", calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { matcher: /komkommer/, baseAmount: 100, baseUnit: "g", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, pieceWeight: 300 },
  { matcher: /sla|lettuce/, baseAmount: 100, baseUnit: "g", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { matcher: /ei\b|eieren/, baseAmount: 1, baseUnit: "stuk", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { matcher: /melk/, baseAmount: 100, baseUnit: "ml", calories: 47, protein: 3.5, carbs: 4.9, fat: 1.5 },
  { matcher: /room/, baseAmount: 100, baseUnit: "ml", calories: 340, protein: 2, carbs: 3, fat: 35 },
  { matcher: /kaas/, baseAmount: 100, baseUnit: "g", calories: 356, protein: 25, carbs: 2, fat: 27 }
];

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanLine(line: string) {
  return line.replace(/^[\-\d.)\s]+/, "").trim();
}

function normalizeIngredient(item: Partial<IngredientItem>): IngredientItem {
  const normalized = {
    id: item.id ?? randomId("ing"),
    name: (item.name ?? "").trim(),
    amount: (item.amount ?? "").trim(),
    unit: normalizeUnit(item.unit ?? "")
  };

  return estimateVagueIngredient(normalized);
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
  const vagueMatch = trimmed.match(/^(een beetje|beetje)\s+(.+)$/i);

  if (vagueMatch) {
    return normalizeIngredient({
      amount: "beetje",
      name: vagueMatch[2]
    });
  }

  const match = trimmed.match(
    /^(\d+(?:[.,]\d+)?(?:\/\d+)?)?\s*(g|gr|kg|ml|l|el|eetlepel|eetlepels|tl|theelepel|theelepels|st|stuk|stuks|hand|handen|schep|scheppen|snuf|snufje|kop|kopje|teen|tenen)?\s*(.+)$/i
  );

  if (!match) {
    return normalizeIngredient({ name: trimmed });
  }

  return normalizeIngredient({
    amount: match[1] ?? "",
    unit: match[2] ?? "",
    name: match[3] ?? trimmed
  });
}

function estimateVagueIngredient(item: IngredientItem): IngredientItem {
  const normalizedAmount = item.amount.trim().toLowerCase();
  if (!normalizedAmount || (normalizedAmount !== "beetje" && normalizedAmount !== "een beetje")) {
    return item;
  }

  const loweredName = item.name.toLowerCase();
  const estimate = VAGUE_AMOUNT_ESTIMATES.find((entry) => entry.matcher.test(loweredName));
  if (!estimate) {
    return {
      ...item,
      amount: "1",
      unit: "snuf"
    };
  }

  return {
    ...item,
    amount: estimate.amount,
    unit: estimate.unit
  };
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

function findNutritionProfile(name: string) {
  const loweredName = name.toLowerCase();
  return NUTRITION_PROFILES.find((profile) => profile.matcher.test(loweredName)) ?? null;
}

function convertIngredientToBaseAmount(ingredient: IngredientItem, profile: NutritionProfile) {
  const amount = parseAmountValue(ingredient.amount);
  if (amount === null) {
    return null;
  }

  const unit = normalizeUnit(ingredient.unit);

  if (profile.baseUnit === "stuk") {
    if (unit === "stuk" || !unit) {
      return amount;
    }
  }

  if (profile.baseUnit === "g") {
    if (unit === "g") return amount;
    if (unit === "kg") return amount * 1000;
    if (unit === "ml") return amount;
    if (unit === "l") return amount * 1000;
    if (unit === "theelepel") return amount * 5;
    if (unit === "eetlepel") return amount * 15;
    if (unit === "hand") return amount * 30;
    if (unit === "schep") return amount * 30;
    if (unit === "stuk" && profile.pieceWeight) return amount * profile.pieceWeight;
  }

  if (profile.baseUnit === "ml") {
    if (unit === "ml") return amount;
    if (unit === "l") return amount * 1000;
    if (unit === "theelepel") return amount * 5;
    if (unit === "eetlepel") return amount * 15;
    if (unit === "stuk" && profile.pieceWeight) return amount * profile.pieceWeight;
  }

  if (!unit && profile.pieceWeight) {
    return amount * profile.pieceWeight;
  }

  return null;
}

function formatMacroValue(value: number, suffix: string) {
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return `${display} ${suffix}`;
}

function estimateMacros(recipe: RecipeDocument): RecipeMacros | undefined {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let matchedIngredients = 0;

  for (const ingredient of recipe.ingredients) {
    const profile = findNutritionProfile(ingredient.name);
    if (!profile) {
      continue;
    }

    const baseAmount = convertIngredientToBaseAmount(ingredient, profile);
    if (baseAmount === null) {
      continue;
    }

    const multiplier = baseAmount / profile.baseAmount;
    totalCalories += profile.calories * multiplier;
    totalProtein += profile.protein * multiplier;
    totalCarbs += profile.carbs * multiplier;
    totalFat += profile.fat * multiplier;
    matchedIngredients += 1;
  }

  if (!matchedIngredients) {
    return undefined;
  }

  const servings = Math.max(1, parseAmountValue(recipe.servings ?? "") ?? 1);

  return {
    calories: formatMacroValue(totalCalories / servings, "kcal"),
    protein: formatMacroValue(totalProtein / servings, "g"),
    carbs: formatMacroValue(totalCarbs / servings, "g"),
    fat: formatMacroValue(totalFat / servings, "g")
  };
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
    cookTime: estimateCookTime(conflictSafeRecipe),
    macros:
      conflictSafeRecipe.macros && Object.values(conflictSafeRecipe.macros).some(Boolean)
        ? conflictSafeRecipe.macros
        : estimateMacros(conflictSafeRecipe)
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
    macros: undefined,
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
    macros: undefined,
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
    macros:
      typeof data.macros === "object" && data.macros !== null
        ? {
            calories:
              typeof (data.macros as Record<string, unknown>).calories === "string"
                ? ((data.macros as Record<string, unknown>).calories as string).trim()
                : "",
            protein:
              typeof (data.macros as Record<string, unknown>).protein === "string"
                ? ((data.macros as Record<string, unknown>).protein as string).trim()
                : "",
            carbs:
              typeof (data.macros as Record<string, unknown>).carbs === "string"
                ? ((data.macros as Record<string, unknown>).carbs as string).trim()
                : "",
            fat:
              typeof (data.macros as Record<string, unknown>).fat === "string"
                ? ((data.macros as Record<string, unknown>).fat as string).trim()
                : ""
          }
        : undefined,
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
