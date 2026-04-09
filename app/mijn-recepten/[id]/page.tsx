import { RecipeDetailView } from "@/components/recipe-detail-view";

export default async function RecipeDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RecipeDetailView recipeId={id} />;
}
