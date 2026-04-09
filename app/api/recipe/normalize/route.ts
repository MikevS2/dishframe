import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { buildNormalizePrompt } from "@/lib/recipe-prompts";
import { fallbackNormalizeRecipe, sanitizeModelRecipe, validateRecipe } from "@/lib/recipe-normalize";
import type { NormalizeRecipeRequest } from "@/lib/types";

export async function POST(request: Request) {
  let payload: NormalizeRecipeRequest;

  try {
    payload = (await request.json()) as NormalizeRecipeRequest;
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const fallbackRecipe = fallbackNormalizeRecipe(payload);
  const fallbackError = validateRecipe(fallbackRecipe);
  if (fallbackError) {
    return NextResponse.json({ error: fallbackError }, { status: 400 });
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json({ recipe: fallbackRecipe, source: "fallback" });
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
      input: buildNormalizePrompt(payload),
      text: {
        format: {
          type: "json_object"
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    const recipe = sanitizeModelRecipe(parsed);
    const validationError = validateRecipe(recipe);

    if (validationError) {
      return NextResponse.json({ recipe: fallbackRecipe, source: "fallback" });
    }

    return NextResponse.json({ recipe, source: "ai" });
  } catch (error) {
    console.error("normalize_error", error);
    return NextResponse.json({ recipe: fallbackRecipe, source: "fallback" });
  }
}
