import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { createRecipePlaceholderDataUrl } from "@/lib/image-placeholder";
import { buildImagePrompt } from "@/lib/recipe-prompts";
import type { RecipeDocument } from "@/lib/types";

export async function POST(request: Request) {
  let payload: { recipe?: RecipeDocument };

  try {
    payload = (await request.json()) as { recipe?: RecipeDocument };
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  if (!payload.recipe?.title) {
    return NextResponse.json({ error: "Er ontbreekt receptinformatie." }, { status: 400 });
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json({
      imageDataUrl: createRecipePlaceholderDataUrl(payload.recipe.title),
      source: "placeholder"
    });
  }

  try {
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini",
      prompt: buildImagePrompt(payload.recipe),
      size: "1024x1024",
      quality: "low",
      output_format: "jpeg",
      output_compression: 60
    });

    const base64Image = result.data?.[0]?.b64_json;
    if (!base64Image) {
      throw new Error("No image returned");
    }

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${base64Image}`,
      source: "ai"
    });
  } catch (error) {
    console.error("image_generation_error", error);
    return NextResponse.json({
      imageDataUrl: createRecipePlaceholderDataUrl(payload.recipe.title),
      source: "placeholder"
    });
  }
}
