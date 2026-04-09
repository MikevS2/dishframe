"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAccount } from "@/components/account-provider";

const CATEGORIES = ["ontbijt", "lunch", "diner", "snack"];
const TAG_FILTERS = ["kip", "vega", "varken", "rund", "vis", "pasta", "warm", "licht"];
const TIME_FILTERS = [
  { value: "all", label: "Alle tijden" },
  { value: "15", label: "Tot 15 min" },
  { value: "30", label: "Tot 30 min" },
  { value: "45", label: "Tot 45 min" },
  { value: "long", label: "Langer dan 45 min" }
];

function parseMinutes(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const match = value.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  return Number.isNaN(minutes) ? null : minutes;
}

export function LibraryOverview() {
  const { recipes, updateRecipeCategory, deleteRecipe, isAuthenticated } = useAccount();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const categoryMatch = categoryFilter === "all" || recipe.category === categoryFilter;
      const tags = recipe.tags ?? [recipe.category];
      const tagMatch = tagFilter === "all" || tags.includes(tagFilter);
      const totalTime =
        recipe.totalTimeMinutes ??
        ((parseMinutes(recipe.recipe.prepTime) ?? 0) + (parseMinutes(recipe.recipe.cookTime) ?? 0) || null);

      const timeMatch =
        timeFilter === "all" ||
        (timeFilter === "15" && totalTime !== null && totalTime <= 15) ||
        (timeFilter === "30" && totalTime !== null && totalTime <= 30) ||
        (timeFilter === "45" && totalTime !== null && totalTime <= 45) ||
        (timeFilter === "long" && totalTime !== null && totalTime > 45);

      return categoryMatch && tagMatch && timeMatch;
    });
  }, [categoryFilter, recipes, tagFilter, timeFilter]);

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="page-grid narrow-grid">
          <section className="panel account-panel">
            <div className="stack">
              <p className="eyebrow">Mijn recepten</p>
              <h1 className="section-title section-title-large">Nog niet ingelogd</h1>
              <p className="section-copy">Log in om je opgeslagen recepten te bekijken.</p>
              <Link href="/login" className="primary-button small-button inline-button">
                Inloggen
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="hero compact-hero">
          <p className="eyebrow">Mijn recepten</p>
          <h1>Vind snel het juiste recept terug</h1>
          <p>
            Filter op categorie, bereidingstijd en type gerecht. Zo houd je je bibliotheek overzichtelijk en rustig.
          </p>
        </section>

        <section className="panel library-filters-panel">
          <div className="library-filters">
            <div className="field">
              <label htmlFor="filter-category">Categorie</label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Alle categorieen</option>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="filter-time">Totale maaktijd</label>
              <select
                id="filter-time"
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value)}
              >
                {TIME_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="filter-type">Soort gerecht</label>
              <select id="filter-type" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <option value="all">Alles</option>
                {TAG_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="library-section">
          <div className="library-heading">
            <h2 className="section-title">Opgeslagen recepten</h2>
            <span className="pill">{filteredRecipes.length}</span>
          </div>

          {filteredRecipes.length ? (
            <div className="library-grid">
              {filteredRecipes.map((item) => (
                <article key={item.id} className="panel library-card">
                  <div className="stack">
                    <div>
                      <h3 className="section-title">{item.title}</h3>
                      <p className="section-copy">{item.updatedAt}</p>
                    </div>

                    <div className="library-card-image">
                      {item.recipe.imageDataUrl ? <img src={item.recipe.imageDataUrl} alt={item.title} /> : null}
                    </div>

                    <div className="library-tags">
                      {(item.tags ?? [item.category]).slice(0, 3).map((tag) => (
                        <span key={tag} className="pill subtle-pill">
                          {tag}
                        </span>
                      ))}
                      {item.totalTimeMinutes ? (
                        <span className="pill subtle-pill">{item.totalTimeMinutes} min</span>
                      ) : null}
                    </div>

                    <div className="field">
                      <label htmlFor={`category-${item.id}`}>Categorie</label>
                      <select
                        id={`category-${item.id}`}
                        value={item.category}
                        onChange={(event) => updateRecipeCategory(item.id, event.target.value)}
                      >
                        {CATEGORIES.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="actions">
                      <Link href={`/mijn-recepten/${item.id}`} className="primary-button">
                        Openen
                      </Link>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setRecipeToDelete(item.id)}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="muted-card">Geen recepten gevonden met deze filters.</div>
          )}
        </section>
      </div>

      {recipeToDelete ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
          <div className="confirm-modal">
            <h2 id="delete-confirm-title">Recept verwijderen?</h2>
            <p>Weet je zeker dat je dit opgeslagen recept wilt verwijderen?</p>
            <div className="actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  deleteRecipe(recipeToDelete);
                  setRecipeToDelete(null);
                }}
              >
                Ja, verwijderen
              </button>
              <button type="button" className="ghost-button" onClick={() => setRecipeToDelete(null)}>
                Nee, bewaren
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
