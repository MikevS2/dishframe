"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { RecipeCard } from "@/components/recipe-card";
import { useAccount } from "@/components/account-provider";
import { LAYOUT_OPTIONS, getLayoutById } from "@/lib/layouts";
import { RECIPE_EXPORT_HEIGHT, RECIPE_EXPORT_WIDTH } from "@/lib/recipe-render";

const CATEGORIES = ["ontbijt", "lunch", "diner", "snack"];

export function RecipeDetailView({ recipeId }: { recipeId: string }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const {
    hasProLayouts,
    getRecipeById,
    updateRecipeCategory,
    updateRecipePresentation,
    deleteRecipe
  } = useAccount();
  const [isDownloading, setIsDownloading] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [layoutUpgradeMessage, setLayoutUpgradeMessage] = useState("");

  const storedRecipe = getRecipeById(recipeId);
  const recipe = storedRecipe?.recipe;
  const selectedLayout = useMemo(
    () => (recipe ? getLayoutById(recipe.layoutId) : getLayoutById("atelier")),
    [recipe]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-detail-picker]")) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function handleDownload() {
    if (!previewRef.current || !recipe) {
      return;
    }

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        canvasWidth: RECIPE_EXPORT_WIDTH,
        canvasHeight: RECIPE_EXPORT_HEIGHT
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${recipe.title.toLowerCase().replace(/\s+/g, "-") || "recept"}.png`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  if (!storedRecipe || !recipe) {
    return (
      <main className="page-shell">
        <div className="page-grid narrow-grid">
          <section className="panel account-panel">
            <h1 className="section-title section-title-large">Recept niet gevonden</h1>
            <p className="section-copy">Dit opgeslagen ontwerp bestaat niet meer of is verwijderd.</p>
            <Link href="/mijn-recepten" className="primary-button">
              Terug naar mijn recepten
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="detail-grid">
          <div className="panel account-panel">
            <div className="stack">
              <div>
                <p className="eyebrow">Opgeslagen recept</p>
                <h1 className="section-title section-title-large">{recipe.title}</h1>
                <p className="section-copy">Aangepast op {storedRecipe.updatedAt}</p>
              </div>

              <div className="field">
                <label htmlFor="recipe-category">Categorie</label>
                <div className="unit-picker" data-detail-picker>
                  <button
                    type="button"
                    id="recipe-category"
                    className="unit-picker-button"
                    aria-haspopup="listbox"
                    aria-expanded={openMenu === "category"}
                    onClick={() => setOpenMenu((current) => (current === "category" ? null : "category"))}
                  >
                    <span>{storedRecipe.category.charAt(0).toUpperCase() + storedRecipe.category.slice(1)}</span>
                  </button>

                  {openMenu === "category" ? (
                    <div className="unit-picker-menu" role="listbox" aria-label="Kies categorie">
                      {CATEGORIES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          role="option"
                          className={`unit-picker-option${storedRecipe.category === option ? " is-selected" : ""}`}
                          onClick={() => {
                            updateRecipeCategory(storedRecipe.id, option);
                            setOpenMenu(null);
                          }}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="field">
                <label htmlFor="recipe-layout">Layout</label>
                <div className="unit-picker" data-detail-picker>
                  <button
                    type="button"
                    id="recipe-layout"
                    className="unit-picker-button"
                    aria-haspopup="listbox"
                    aria-expanded={openMenu === "layout"}
                    onClick={() => setOpenMenu((current) => (current === "layout" ? null : "layout"))}
                  >
                    <span>{selectedLayout.name}</span>
                  </button>

                  {openMenu === "layout" ? (
                    <div className="unit-picker-menu" role="listbox" aria-label="Kies layout">
                      {LAYOUT_OPTIONS.map((layout) => (
                        <button
                          key={layout.id}
                          type="button"
                          role="option"
                          className={`unit-picker-option${recipe.layoutId === layout.id ? " is-selected" : ""}`}
                          onClick={() => {
                            if (layout.premium && !hasProLayouts) {
                              setLayoutUpgradeMessage(
                                "Upgrade je abonnement naar Plus om Pro-layouts te gebruiken."
                              );
                              setOpenMenu(null);
                              return;
                            }

                            setLayoutUpgradeMessage("");
                            updateRecipePresentation(storedRecipe.id, layout.id);
                            setOpenMenu(null);
                          }}
                        >
                          {layout.name}
                          {layout.premium ? " (Pro)" : ""}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {layoutUpgradeMessage ? <p className="status upgrade-hint">{layoutUpgradeMessage}</p> : null}

              <div className="field">
                <label htmlFor="recipe-color">Kleur</label>
                <div className="unit-picker" data-detail-picker>
                  <button
                    type="button"
                    id="recipe-color"
                    className="unit-picker-button"
                    aria-haspopup="listbox"
                    aria-expanded={openMenu === "color"}
                    onClick={() => setOpenMenu((current) => (current === "color" ? null : "color"))}
                  >
                    <span>
                      {selectedLayout.themes.find((theme) => theme.id === recipe.colorThemeId)?.name ??
                        selectedLayout.themes[0]?.name}
                    </span>
                  </button>

                  {openMenu === "color" ? (
                    <div className="unit-picker-menu" role="listbox" aria-label="Kies kleur">
                      {selectedLayout.themes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          role="option"
                          className={`unit-picker-option${recipe.colorThemeId === theme.id ? " is-selected" : ""}`}
                          onClick={() => {
                            updateRecipePresentation(storedRecipe.id, recipe.layoutId, theme.id);
                            setOpenMenu(null);
                          }}
                        >
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="actions">
                <button type="button" className="primary-button" onClick={handleDownload}>
                  {isDownloading ? "PNG maken..." : "Download als PNG"}
                </button>
                <button type="button" className="ghost-button" onClick={() => deleteRecipe(storedRecipe.id)}>
                  Verwijderen
                </button>
              </div>
            </div>
          </div>

          <div className="panel preview-panel">
            <div ref={previewRef} className="recipe-preview-shell">
              <div className="recipe-preview-frame">
                <RecipeCard recipe={recipe} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
