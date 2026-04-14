import type { RecipeDocument } from "@/lib/types";
import { getLayoutById, getLayoutTheme } from "@/lib/layouts";
import { formatQuantity } from "@/lib/recipe-units";

interface RecipeCardProps {
  recipe: RecipeDocument;
}

function RecipeMeta({ recipe }: { recipe: RecipeDocument }) {
  const metaItems = [
    recipe.servings ? `Porties: ${recipe.servings}` : "",
    recipe.mealType ? `Moment: ${recipe.mealType}` : "",
    recipe.prepTime ? `Voorbereiding: ${recipe.prepTime}` : "",
    recipe.cookTime ? `Kooktijd: ${recipe.cookTime}` : ""
  ].filter(Boolean);

  if (!metaItems.length) {
    return null;
  }

  return (
    <div className="recipe-meta">
      {metaItems.map((item) => (
        <span key={item} className="recipe-meta-pill">
          {item}
        </span>
      ))}
    </div>
  );
}

function RecipeMacros({ recipe }: { recipe: RecipeDocument }) {
  const macroItems = [
    recipe.macros?.calories ? { label: "Kcal", value: recipe.macros.calories } : null,
    recipe.macros?.protein ? { label: "Eiwit", value: recipe.macros.protein } : null,
    recipe.macros?.carbs ? { label: "Koolhydraten", value: recipe.macros.carbs } : null,
    recipe.macros?.fat ? { label: "Vet", value: recipe.macros.fat } : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (!macroItems.length) {
    return null;
  }

  return (
    <section className="recipe-macros">
      <span className="recipe-macros-label">Macro&apos;s per portie</span>
      <div className="recipe-macros-grid">
        {macroItems.map((item) => (
          <div key={item.label} className="recipe-macro-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function IngredientsTable({ recipe }: { recipe: RecipeDocument }) {
  return (
    <table className="ingredients-table" aria-label="Ingredienten">
      <thead>
        <tr>
          <th>Ingredienten</th>
          <th>Hoeveelheid</th>
        </tr>
      </thead>
      <tbody>
        {recipe.ingredients.map((ingredient) => (
          <tr key={ingredient.id}>
            <td>{ingredient.name}</td>
            <td>{formatQuantity(ingredient.amount, ingredient.unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RecipeImage({ recipe }: { recipe: RecipeDocument }) {
  return (
    <div className="recipe-image-wrap">
      {recipe.imageDataUrl ? (
        <img
          className="recipe-image"
          src={recipe.imageDataUrl}
          alt={`Visualisatie van ${recipe.title}`}
        />
      ) : null}
    </div>
  );
}

function InstructionList({
  recipe,
  twoColumns = false,
  className = ""
}: {
  recipe: RecipeDocument;
  twoColumns?: boolean;
  className?: string;
}) {
  return (
    <ol className={["recipe-steps", twoColumns ? "is-two-column" : "", className].filter(Boolean).join(" ")}>
      {recipe.instructions.map((instruction, index) => (
        <li key={`${recipe.title}-${index}`}>{instruction}</li>
      ))}
    </ol>
  );
}

function InstructionsBlock({
  recipe,
  twoColumns = false
}: {
  recipe: RecipeDocument;
  twoColumns?: boolean;
}) {
  return (
    <section className="recipe-section">
      <h2>Bereiding {recipe.title.toLowerCase()}</h2>
      <InstructionList recipe={recipe} twoColumns={twoColumns} />
    </section>
  );
}

function IngredientList({ recipe }: { recipe: RecipeDocument }) {
  return (
    <ul className="ingredient-list">
      {recipe.ingredients.map((ingredient) => (
        <li key={ingredient.id}>
          <span>{ingredient.name}</span>
          <strong>{formatQuantity(ingredient.amount, ingredient.unit)}</strong>
        </li>
      ))}
    </ul>
  );
}

function IngredientChips({ recipe }: { recipe: RecipeDocument }) {
  return (
    <div className="ingredient-chips">
      {recipe.ingredients.map((ingredient) => (
        <span key={ingredient.id} className="ingredient-chip">
          {ingredient.name}
          <strong>{formatQuantity(ingredient.amount, ingredient.unit)}</strong>
        </span>
      ))}
    </div>
  );
}

function renderLayoutBody(recipe: RecipeDocument, twoColumnInstructions: boolean) {
  switch (recipe.layoutId) {
    case "linnen":
      return (
        <section className="recipe-body recipe-body-linnen">
          <RecipeImage recipe={recipe} />
          <div className="linnen-side">
            <div className="recipe-note-block">
              <span className="recipe-note-label">Ingredienten</span>
              <IngredientList recipe={recipe} />
            </div>
            <div className="recipe-note-block">
              <span className="recipe-note-label">Bereiding</span>
              <InstructionList
                recipe={recipe}
                twoColumns={twoColumnInstructions}
                className="recipe-note-steps"
              />
            </div>
          </div>
        </section>
      );

    case "maison":
      return (
        <section className="recipe-body recipe-body-maison">
          <div className="maison-media">
            <RecipeImage recipe={recipe} />
          </div>
          <div className="maison-content">
            <IngredientChips recipe={recipe} />
            <InstructionsBlock recipe={recipe} twoColumns={twoColumnInstructions} />
          </div>
        </section>
      );

    case "signature":
      return (
        <section className="recipe-body recipe-body-signature">
          <div className="signature-panel">
            <span className="signature-label">Samenstelling</span>
            <IngredientsTable recipe={recipe} />
          </div>
          <div className="signature-panel">
            <RecipeImage recipe={recipe} />
            <InstructionsBlock recipe={recipe} twoColumns={twoColumnInstructions} />
          </div>
        </section>
      );

    case "journal":
      return (
        <section className="recipe-body recipe-body-journal">
          <div className="journal-column">
            <InstructionsBlock recipe={recipe} twoColumns={twoColumnInstructions} />
          </div>
          <div className="journal-column">
            <RecipeImage recipe={recipe} />
            <div className="journal-divider" />
            <IngredientList recipe={recipe} />
          </div>
        </section>
      );

    case "salon":
      return (
        <section className="recipe-body recipe-body-salon">
          <div className="salon-header">
            <RecipeImage recipe={recipe} />
          </div>
          <div className="salon-grid">
            <div className="salon-card">
              <span className="recipe-note-label">Ingredienten</span>
              <IngredientList recipe={recipe} />
            </div>
            <div className="salon-card">
              <span className="recipe-note-label">Bereiding</span>
              <InstructionList
                recipe={recipe}
                twoColumns={twoColumnInstructions}
                className="recipe-note-steps"
              />
            </div>
          </div>
        </section>
      );

    case "terracotta":
      return (
        <section className="recipe-body recipe-body-terracotta">
          <div className="terracotta-top">
            <div className="terracotta-copy">
              <InstructionsBlock recipe={recipe} twoColumns={twoColumnInstructions} />
            </div>
            <RecipeImage recipe={recipe} />
          </div>
          <div className="terracotta-bottom">
            <IngredientsTable recipe={recipe} />
          </div>
        </section>
      );

    case "atelier":
    default:
      return (
        <>
          <section className="recipe-body">
            <IngredientsTable recipe={recipe} />
            <RecipeImage recipe={recipe} />
          </section>
          <InstructionsBlock recipe={recipe} twoColumns={twoColumnInstructions} />
        </>
      );
  }
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const layout = getLayoutById(recipe.layoutId);
  const theme = getLayoutTheme(recipe.layoutId, recipe.colorThemeId);
  const contentScore =
    recipe.ingredients.length * 2 +
    recipe.instructions.length * 3 +
    recipe.instructions.join(" ").length / 180;
  const densityClass = contentScore > 24 ? "is-dense" : contentScore > 16 ? "is-compact" : "";
  const twoColumnInstructions = contentScore > 18 || recipe.instructions.join(" ").length > 460;
  const cardClassName = ["recipe-card", `layout-${layout.id}`, densityClass].filter(Boolean).join(" ");

  return (
    <article
      className={cardClassName}
      style={
        {
          "--layout-accent": theme.accent,
          "--layout-accent-soft": theme.accentSoft,
          "--layout-paper": theme.paper,
          "--layout-rule": theme.rule,
          "--layout-tag": theme.tag
        } as React.CSSProperties
      }
    >
      <h1 className="recipe-title">{recipe.title}</h1>
      <RecipeMeta recipe={recipe} />
      <RecipeMacros recipe={recipe} />
      <div className="recipe-rule" />

      {renderLayoutBody(recipe, twoColumnInstructions)}
    </article>
  );
}
