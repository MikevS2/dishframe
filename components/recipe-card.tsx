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

function InstructionsBlock({ recipe }: { recipe: RecipeDocument }) {
  return (
    <section className="recipe-section">
      <h2>Bereiding {recipe.title.toLowerCase()}</h2>
      <p>{recipe.instructions.join("\n\n")}</p>
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

function renderLayoutBody(recipe: RecipeDocument) {
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
              <p className="recipe-note-copy">{recipe.instructions.join("\n\n")}</p>
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
            <InstructionsBlock recipe={recipe} />
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
            <InstructionsBlock recipe={recipe} />
          </div>
        </section>
      );

    case "journal":
      return (
        <section className="recipe-body recipe-body-journal">
          <div className="journal-column">
            <InstructionsBlock recipe={recipe} />
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
              <p className="recipe-note-copy">{recipe.instructions.join("\n\n")}</p>
            </div>
          </div>
        </section>
      );

    case "terracotta":
      return (
        <section className="recipe-body recipe-body-terracotta">
          <div className="terracotta-top">
            <div className="terracotta-copy">
              <InstructionsBlock recipe={recipe} />
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
          <InstructionsBlock recipe={recipe} />
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
      <div className="recipe-rule" />

      {renderLayoutBody(recipe)}
    </article>
  );
}
