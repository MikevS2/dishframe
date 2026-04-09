import type { NormalizeRecipeRequest, RecipeDocument } from "@/lib/types";

export const RECIPE_STYLE_PROMPT = `Je bent redacteur van een culinaire receptenstudio.

Doel:
- normaliseer receptgegevens naar nette, consequente JSON
- behoud de betekenis van het originele recept
- schrijf bereidingsstappen in helder, verzorgd Nederlands
- gebruik een warme, compacte kookboekstijl

Schrijfregels:
- gebruik actieve formuleringen
- maak de tekst niet bloemrijk
- gebruik altijd korte, duidelijke kookzinnen
- houd elke stap compact en praktisch
- gebruik doorgaans dezelfde rustige kookboektoon
- vermijd onnodige variatie in stijl tussen vergelijkbare recepten
- splits lange alinea's op in duidelijke stappen
- geef ingredienten schoon en beknopt weer
- respecteer details uit de ingredientenlijst letterlijk in de bereidingswijze
- als er bijvoorbeeld "met schil" staat, laat die informatie dan intact
- schat een logisch aantal porties in als dat niet expliciet is gegeven
- schat ook het eetmoment in als dat logisch af te leiden is, zoals ontbijt, lunch, diner of snack
- schat ook een logische voorbereidingstijd en kooktijd in als die niet expliciet is gegeven
- geef tijden kort weer, bijvoorbeeld "10 min" of "25 min"
- laat onzekere details leeg in plaats van ze te verzinnen
- antwoord uitsluitend als JSON`;

export function buildNormalizePrompt(payload: NormalizeRecipeRequest) {
  return `${RECIPE_STYLE_PROMPT}

Lever JSON met exact deze structuur:
{
  "title": "string",
  "servings": "string of leeg",
  "mealType": "ontbijt, lunch, diner, snack of leeg",
  "prepTime": "string of leeg",
  "cookTime": "string of leeg",
  "ingredients": [
    { "name": "string", "amount": "string", "unit": "string" }
  ],
  "instructions": ["string"]
}

Input:
${JSON.stringify(payload, null, 2)}`;
}

export function buildImagePrompt(recipe: RecipeDocument) {
  const ingredients = recipe.ingredients
    .map((item) => `${item.amount} ${item.unit} ${item.name}`.trim())
    .join(", ");

  return `Maak een realistische, smaakvolle foodfoto van het gerecht "${recipe.title}".
Belangrijke ingredienten: ${ingredients}.
Visuele stijl: redactionele foodfotografie, natuurlijk licht, aantrekkelijk opgediend, subtiele schaduwen, beige/warme ondergrond, geen tekst in beeld, geen handen, geen bestek prominent in beeld.
Compositie: close-up tot driekwart beeld, geschikt voor een stijlvolle receptkaart.
Resultaat: een geloofwaardige, eetlustopwekkende gerechtfoto.`;
}
