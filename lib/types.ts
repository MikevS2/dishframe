export type RecipeLayoutId =
  | "atelier"
  | "linnen"
  | "maison"
  | "signature"
  | "journal"
  | "salon"
  | "terracotta";
export type RecipeImageMode = "generated" | "uploaded";
export type RecipeInputMode = "form" | "raw";
export type RecipeColorThemeId = string;

export interface IngredientItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeMacros {
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export interface RecipeDocument {
  title: string;
  ingredients: IngredientItem[];
  instructions: string[];
  servings?: string;
  mealType?: string;
  prepTime?: string;
  cookTime?: string;
  macros?: RecipeMacros;
  imageMode: RecipeImageMode;
  layoutId: RecipeLayoutId;
  colorThemeId?: RecipeColorThemeId;
  imageDataUrl?: string;
}

export interface NormalizeRecipeRequest {
  inputMode: RecipeInputMode;
  rawText?: string;
  draft?: {
    title: string;
    servings?: string;
    mealType?: string;
    prepTime?: string;
    cookTime?: string;
    ingredients: IngredientItem[];
    instructions: string[];
  };
}
