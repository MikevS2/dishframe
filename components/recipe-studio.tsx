"use client";

import { ChangeEvent, startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { useAccount } from "@/components/account-provider";
import { useNavigationGuard } from "@/components/navigation-guard-provider";
import { RecipeCard } from "@/components/recipe-card";
import { LAYOUT_OPTIONS, getLayoutById, getLayoutTheme } from "@/lib/layouts";
import { FORM_UNIT_OPTIONS } from "@/lib/recipe-units";
import type {
  IngredientItem,
  NormalizeRecipeRequest,
  RecipeDocument,
  RecipeImageMode,
  RecipeInputMode
} from "@/lib/types";

const MEAL_TYPE_OPTIONS = [
  { value: "", label: "" },
  { value: "ontbijt", label: "Ontbijt" },
  { value: "lunch", label: "Lunch" },
  { value: "diner", label: "Diner" },
  { value: "snack", label: "Snack" }
];

function createIngredient(): IngredientItem {
  return {
    id: `ing-${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    amount: "",
    unit: ""
  };
}

function createStep() {
  return "";
}

function createInitialIngredients(): IngredientItem[] {
  return [
    { id: "ing-1", name: "", amount: "", unit: "" },
    { id: "ing-2", name: "", amount: "", unit: "" },
    { id: "ing-3", name: "", amount: "", unit: "" }
  ];
}

function createInitialSteps(): string[] {
  return ["", "", ""];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createLayoutPreviewRecipe(layoutId: RecipeDocument["layoutId"]): RecipeDocument {
  const layout = getLayoutById(layoutId);
  return {
    title: "Jouw recept",
    servings: "4",
    prepTime: "15 min",
    cookTime: "20 min",
    layoutId,
    colorThemeId: layout.defaultThemeId,
    imageMode: "generated",
    imageDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZyIgeDE9IjAiIHgyPSIxIiB5MT0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlN2QzYjAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNkYmM0OWYiLz48L2xpbmVhckdyYWRpZW50PjxyYWRpYWxHcmFkaWVudCBpZD0icGxhdGUiIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjQwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNkNmM0YTYiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNiZykiLz48Y2lyY2xlIGN4PSI0ODAiIGN5PSIzMDAiIHI9IjE3MCIgZmlsbD0idXJsKCNwbGF0ZSkiLz48Y2lyY2xlIGN4PSI0MzAiIGN5PSIzMDAiIHI9IjQ1IiBmaWxsPSIjYjY3ZDRlIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxjaXJjbGUgY3g9IjUwMCIgY3k9IjI2MCIgcj0iMzYiIGZpbGw9IiNkYWFlNTUiIGZpbGwtb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjUzMCIgY3k9IjMzMCIgcj0iNTIiIGZpbGw9IiM4Yzg2NTEiIGZpbGwtb3BhY2l0eT0iMC44MiIvPjxjaXJjbGUgY3g9IjQ2MCIgY3k9IjM1MCIgcj0iNDAiIGZpbGw9IiNkMjg3NWYiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PC9zdmc+",
    ingredients: [
      { id: "preview-1", name: "Ingredient", amount: "200", unit: "g" },
      { id: "preview-2", name: "Ingredient", amount: "2", unit: "stuk" },
      { id: "preview-3", name: "Ingredient", amount: "1", unit: "eetlepel" },
      { id: "preview-4", name: "Ingredient", amount: "50", unit: "ml" }
    ],
    instructions: [
      "Bereid jouw recept stap voor stap in een rustige en duidelijke opmaak.",
      "Laat ingredienten, bereiding en afbeelding samenkomen in een stijl die past bij jouw recept.",
      "Bewaar, deel of download het eindresultaat zodra alles naar wens is."
    ]
  };
}

export function RecipeStudio() {
  const previewRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { setHasUnsavedChanges } = useNavigationGuard();
  const {
    user,
    activePlan,
    remainingGenerationsLabel,
    hasProLayouts,
    canGenerate,
    consumeGeneration,
    saveRecipe,
    recipes
  } = useAccount();
  const [inputMode, setInputMode] = useState<RecipeInputMode>("form");
  const [imageMode, setImageMode] = useState<RecipeImageMode>("generated");
  const [layoutId, setLayoutId] = useState<RecipeDocument["layoutId"]>("atelier");
  const [colorThemeId, setColorThemeId] = useState(getLayoutById("atelier").defaultThemeId);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [openUnitMenuId, setOpenUnitMenuId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState("");
  const [mealType, setMealType] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>(createInitialIngredients);
  const [instructions, setInstructions] = useState<string[]>(createInitialSteps);
  const [rawText, setRawText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | undefined>();
  const [recipe, setRecipe] = useState<RecipeDocument | null>(null);
  const [isCurrentDesignSaved, setIsCurrentDesignSaved] = useState(false);
  const [pendingLayoutId, setPendingLayoutId] = useState<RecipeDocument["layoutId"] | null>(null);
  const [isConfirmingLayoutChange, setIsConfirmingLayoutChange] = useState(false);
  const [layoutUpgradeMessage, setLayoutUpgradeMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const deferredRecipe = useDeferredValue(recipe);
  const selectedLayout = getLayoutById(layoutId);
  const selectedTheme = getLayoutTheme(layoutId, colorThemeId);
  const layoutPreviewRecipe = createLayoutPreviewRecipe(layoutId);
  const activeRecipe = deferredRecipe ? { ...deferredRecipe, layoutId, colorThemeId } : null;
  const hasUsableFormData = Boolean(
    title.trim() &&
      ingredients.some((item) => item.name.trim()) &&
      instructions.some((step) => step.trim())
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (!layoutMenuRef.current?.contains(target)) {
        setIsLayoutMenuOpen(false);
      }

      if (!target.closest("[data-unit-picker]")) {
        setOpenUnitMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(Boolean(recipe && !isCurrentDesignSaved));
  }, [isCurrentDesignSaved, recipe, setHasUnsavedChanges]);

  function updateIngredient(id: string, field: keyof IngredientItem, value: string) {
    setIngredients((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function getUnitLabel(value: string) {
    return FORM_UNIT_OPTIONS.find((option) => option.value === value)?.label ?? "Kies eenheid";
  }

  function getMealTypeLabel(value: string) {
    return MEAL_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "";
  }

  function updateInstruction(index: number, value: string) {
    setInstructions((current) => current.map((step, stepIndex) => (stepIndex === index ? value : step)));
  }

  function removeIngredient(id: string) {
    setIngredients((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  }

  function removeInstruction(index: number) {
    setInstructions((current) => (current.length > 1 ? current.filter((_, stepIndex) => stepIndex !== index) : current));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Upload een geldig afbeeldingsbestand.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Bestand kon niet worden gelezen."));
      reader.readAsDataURL(file);
    });

    setUploadedImage(dataUrl);
    setError("");
    setStatus("Eigen afbeelding geladen. Genereer opnieuw om de preview bij te werken.");
  }

  function buildPayload(): NormalizeRecipeRequest {
    if (inputMode === "raw") {
      return {
        inputMode,
        rawText
      };
    }

    return {
      inputMode,
      draft: {
        title,
        servings,
        mealType,
        prepTime,
        cookTime,
        ingredients,
        instructions
      }
    };
  }

  function requestLayoutChange(nextLayoutId: RecipeDocument["layoutId"]) {
    const nextLayout = getLayoutById(nextLayoutId);

    if (nextLayout.premium && !hasProLayouts) {
      setLayoutUpgradeMessage("Upgrade je abonnement naar Plus om Pro-layouts te gebruiken.");
      setIsLayoutMenuOpen(false);
      return;
    }

    setLayoutUpgradeMessage("");

    if (nextLayoutId === layoutId) {
      setIsLayoutMenuOpen(false);
      return;
    }

    if (recipe && !isCurrentDesignSaved) {
      setPendingLayoutId(nextLayoutId);
      setIsConfirmingLayoutChange(true);
      setIsLayoutMenuOpen(false);
      return;
    }

    setLayoutId(nextLayoutId);
    setColorThemeId(getLayoutById(nextLayoutId).defaultThemeId);
    setIsLayoutMenuOpen(false);
  }

  function confirmLayoutChange() {
    if (!pendingLayoutId) {
      setIsConfirmingLayoutChange(false);
      return;
    }

    setLayoutId(pendingLayoutId);
    setColorThemeId(getLayoutById(pendingLayoutId).defaultThemeId);
    setIsCurrentDesignSaved(false);
    setPendingLayoutId(null);
    setIsConfirmingLayoutChange(false);
    setStatus("De layout is aangepast.");
  }

  function cancelLayoutChange() {
    setPendingLayoutId(null);
    setIsConfirmingLayoutChange(false);
  }

  async function handleGenerateRecipe() {
    setError("");
    setStatus("");

    if (!user) {
      setError("Log eerst in om recepten te genereren en op te slaan.");
      return;
    }

    if (!canGenerate) {
      setError("Je generatiebundel is op. Upgrade je abonnement om verder te gaan.");
      return;
    }

    if (inputMode === "raw" && !rawText.trim()) {
      setError("Plak eerst een recepttekst om te verwerken.");
      return;
    }

    if (inputMode === "form" && !hasUsableFormData) {
      setError("Vul een titel, minimaal een ingredient en een bereidingsstap in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizeResponse = await fetch("/api/recipe/normalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload())
      });

      const normalizeResult = await normalizeResponse.json();
      if (!normalizeResponse.ok) {
        throw new Error(normalizeResult.error || "Het recept kon niet worden verwerkt.");
      }

      const nextRecipe = normalizeResult.recipe as RecipeDocument;
      nextRecipe.layoutId = layoutId;
      nextRecipe.colorThemeId = colorThemeId;
      nextRecipe.imageMode = imageMode;

      if (imageMode === "uploaded" && uploadedImage) {
        nextRecipe.imageDataUrl = uploadedImage;
      } else {
        const imageResponse = await fetch("/api/recipe/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ recipe: nextRecipe })
        });

        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) {
          throw new Error(imageResult.error || "De afbeelding kon niet worden gemaakt.");
        }

        nextRecipe.imageDataUrl = imageResult.imageDataUrl;
      }

      startTransition(() => {
        setRecipe(nextRecipe);
      });
      consumeGeneration();
      setIsCurrentDesignSaved(false);

      setStatus(
        normalizeResult.source === "ai"
          ? "Jouw recept is verwerkt en mooi opgemaakt."
          : "Jouw recept is verwerkt en staat klaar."
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Er ging iets mis tijdens het genereren."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDesign() {
    if (!activeRecipe) {
      return;
    }

    if (!user) {
      setError("Log eerst in om ontwerpen op te slaan.");
      return;
    }

    saveRecipe(activeRecipe);
    setIsCurrentDesignSaved(true);
    setStatus("Je ontwerp is opgeslagen in Mijn recepten.");
  }

  async function handleDownloadPng() {
    if (!previewRef.current || !activeRecipe) {
      return;
    }

    setIsDownloading(true);
    setError("");

    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slugify(activeRecipe.title || "receptkaart") || "receptkaart"}.png`;
      link.click();
    } catch {
      setError("De PNG kon niet worden gedownload.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="hero">
          <h1>Van jouw recept naar een mooi ontwerp.</h1>
          <p>
            Vul je ingredienten en bereidingswijze in of plak je recept als tekst. Alles wordt
            overzichtelijk, stijlvol en klaar om te bewaren, delen of downloaden.
          </p>
        </section>

        {user ? (
          <section className="account-bar panel">
            <div className="account-bar-content">
              <div>
                <p className="eyebrow">Account actief</p>
                <h2 className="section-title">Welkom, {user.name}</h2>
                <p className="section-copy">{activePlan.name}. {remainingGenerationsLabel}</p>
              </div>
              <div className="actions">
                <Link href="/mijn-recepten" className="ghost-button">
                  Mijn recepten
                </Link>
                <Link href="/abonnement" className="primary-button">
                  Abonnement bekijken
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="studio-grid">
          <div className="panel editor-panel" ref={editorRef}>
            <div className="stack">
                <div>
                  <h2 className="section-title">Invoer</h2>
                  <p className="section-copy">
                    Kies hoe je het recept aanlevert. Daarna wordt alles netjes geformuleerd en
                    mooi opgemaakt.
                  </p>
                </div>

              <div className="field">
                <span className="subheading">Inputmodus</span>
                <div className="segmented" role="tablist" aria-label="Inputmodus">
                  <button
                    type="button"
                    className={inputMode === "form" ? "is-active" : ""}
                    onClick={() => setInputMode("form")}
                  >
                    Formulier
                  </button>
                  <button
                    type="button"
                    className={inputMode === "raw" ? "is-active" : ""}
                    onClick={() => setInputMode("raw")}
                  >
                    Ruwe tekst
                  </button>
                </div>
              </div>

              {inputMode === "form" ? (
                <div className="stack">
                  <div className="inline-grid form-grid">
                    <div className="field">
                      <label htmlFor="title">Recepttitel</label>
                      <input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="servings">Porties</label>
                      <input
                        id="servings"
                        value={servings}
                        onChange={(event) => setServings(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="inline-grid timing-grid">
                    <div className="field">
                      <label htmlFor="prepTime">Voorbereidingstijd</label>
                      <input
                        id="prepTime"
                        value={prepTime}
                        onChange={(event) => setPrepTime(event.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="cookTime">Kooktijd</label>
                      <input
                        id="cookTime"
                        value={cookTime}
                        onChange={(event) => setCookTime(event.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="mealType">Moment</label>
                      <div className="unit-picker" data-unit-picker>
                        <button
                          type="button"
                          id="mealType"
                          className="unit-picker-button"
                          aria-haspopup="listbox"
                          aria-expanded={openUnitMenuId === "meal-type"}
                          onClick={() =>
                            setOpenUnitMenuId((current) => (current === "meal-type" ? null : "meal-type"))
                          }
                        >
                          <span>{getMealTypeLabel(mealType)}</span>
                        </button>

                        {openUnitMenuId === "meal-type" ? (
                          <div className="unit-picker-menu" role="listbox" aria-label="Kies moment">
                            {MEAL_TYPE_OPTIONS.map((option) => (
                              <button
                                key={option.value || "empty"}
                                type="button"
                                role="option"
                                className={`unit-picker-option${mealType === option.value ? " is-selected" : ""}`}
                                onClick={() => {
                                  setMealType(option.value);
                                  setOpenUnitMenuId(null);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <span className="subheading">Ingredienten</span>
                    <div className="rows">
                      {ingredients.map((ingredient) => (
                        <div className="ingredient-row" key={ingredient.id}>
                          <div className="field">
                            <label htmlFor={`${ingredient.id}-name`}>Naam</label>
                            <input
                              id={`${ingredient.id}-name`}
                              value={ingredient.name}
                              onChange={(event) =>
                                updateIngredient(ingredient.id, "name", event.target.value)
                              }
                              placeholder="Zalm"
                            />
                          </div>

                          <div className="field">
                            <label htmlFor={`${ingredient.id}-amount`}>Hoeveelheid</label>
                            <input
                              id={`${ingredient.id}-amount`}
                              value={ingredient.amount}
                              onChange={(event) =>
                                updateIngredient(ingredient.id, "amount", event.target.value)
                              }
                              placeholder="200"
                            />
                          </div>

                          <div className="field">
                            <label htmlFor={`${ingredient.id}-unit`}>Eenheid</label>
                            <div className="unit-picker" data-unit-picker>
                              <button
                                type="button"
                                id={`${ingredient.id}-unit`}
                                className="unit-picker-button"
                                aria-haspopup="listbox"
                                aria-expanded={openUnitMenuId === ingredient.id}
                                onClick={() =>
                                  setOpenUnitMenuId((current) =>
                                    current === ingredient.id ? null : ingredient.id
                                  )
                                }
                              >
                                <span>{getUnitLabel(ingredient.unit)}</span>
                              </button>

                              {openUnitMenuId === ingredient.id ? (
                                <div className="unit-picker-menu" role="listbox" aria-label="Kies eenheid">
                                  {FORM_UNIT_OPTIONS.map((option) => (
                                    <button
                                      key={option.value || "empty"}
                                      type="button"
                                      role="option"
                                      className={`unit-picker-option${
                                        ingredient.unit === option.value ? " is-selected" : ""
                                      }`}
                                      onClick={() => {
                                        updateIngredient(ingredient.id, "unit", option.value);
                                        setOpenUnitMenuId(null);
                                      }}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="icon-button"
                            aria-label="Verwijder ingredient"
                            onClick={() => removeIngredient(ingredient.id)}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setIngredients((current) => [...current, createIngredient()])}
                    >
                      Ingredient toevoegen
                    </button>
                  </div>

                  <div className="field">
                    <span className="subheading">Bereidingsstappen</span>
                    <div className="rows">
                      {instructions.map((step, index) => (
                        <div className="step-row" key={`step-${index}`}>
                          <span className="row-badge">{index + 1}</span>
                          <div className="field">
                            <label htmlFor={`step-${index}`}>Stap {index + 1}</label>
                            <textarea
                              id={`step-${index}`}
                              value={step}
                              onChange={(event) => updateInstruction(index, event.target.value)}
                              placeholder="Beschrijf wat de gebruiker in deze stap moet doen."
                            />
                          </div>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label="Verwijder stap"
                            onClick={() => removeInstruction(index)}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setInstructions((current) => [...current, createStep()])}
                    >
                      Stap toevoegen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="rawText">Ruwe recepttekst</label>
                  <textarea
                    id="rawText"
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                    placeholder={"Plak hier bijvoorbeeld:\nGebakken rijst met zalm\n\nIngredienten\n80 g rijst\n200 g zalm\n...\n\nBereiding\nKook de rijst...\nBak de zalm..."}
                  />
                  <p className="input-help">
                    Wij maken er automatisch een duidelijke titel, ingredientenlijst en
                    bereidingswijze van, en schatten porties, moment en tijd als dit niet is
                    opgegeven.
                  </p>
                </div>
              )}

              <div className="field">
                <span className="subheading">Afbeelding</span>
                <div className="segmented" role="tablist" aria-label="Afbeeldingsmodus">
                  <button
                    type="button"
                    className={imageMode === "generated" ? "is-active" : ""}
                    onClick={() => setImageMode("generated")}
                  >
                    AI genereren
                  </button>
                  <button
                    type="button"
                    className={imageMode === "uploaded" ? "is-active" : ""}
                    onClick={() => setImageMode("uploaded")}
                  >
                    Zelf uploaden
                  </button>
                </div>
              </div>

              {imageMode === "uploaded" ? (
                <div className="upload-box">
                  <label htmlFor="imageUpload" className="subheading">
                    Upload gerechtfoto
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                  />
                  <p className="input-help">
                    Ondersteund: PNG, JPG en WebP. De upload wordt direct in de layout gebruikt.
                  </p>
                  {uploadedImage ? <span className="pill">Afbeelding staat klaar</span> : null}
                </div>
              ) : (
                <div className="upload-box">
                  <span className="subheading">AI-afbeelding</span>
                  <p className="input-help">
                    Er wordt automatisch een AI-gegenereerde afbeelding aan je recept toegevoegd.
                  </p>
                </div>
              )}

              {error ? <p className="status error">{error}</p> : null}
              {status ? <p className="status success">{status}</p> : null}

              <div className="actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSubmitting || (imageMode === "uploaded" && !uploadedImage)}
                  onClick={handleGenerateRecipe}
                >
                  {isSubmitting ? "Recept verwerken..." : "Recept genereren"}
                </button>

                <button
                  type="button"
                  className="ghost-button"
                  disabled={!activeRecipe}
                  onClick={handleSaveDesign}
                >
                  Ontwerp opslaan
                </button>

                <button
                  type="button"
                  className="ghost-button"
                  disabled={!activeRecipe || isDownloading}
                  onClick={handleDownloadPng}
                >
                  {isDownloading ? "PNG maken..." : "Download als PNG"}
                </button>
              </div>

            </div>
          </div>

          <div className="panel preview-panel">
            <div className="preview-header">
              <div>
                <h2 className="section-title">Live preview</h2>
                <p>Bekijk hier direct jouw recept.</p>
              </div>
              <div className="layout-switcher-wrap">
                <span className="layout-switcher-label">Layout:</span>
                <div className="layout-switcher-field" ref={layoutMenuRef}>
                  <button
                    type="button"
                    className="layout-switcher-button"
                    aria-haspopup="listbox"
                    aria-expanded={isLayoutMenuOpen}
                    onClick={() => setIsLayoutMenuOpen((current) => !current)}
                  >
                    <span>{selectedLayout.name}</span>
                  </button>

                  {isLayoutMenuOpen ? (
                    <div className="layout-switcher-menu" role="listbox" aria-label="Kies layout">
                      {LAYOUT_OPTIONS.map((layout) => {
                        const isSelected = layout.id === layoutId;

                        return (
                          <button
                            key={layout.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className={`layout-switcher-option${isSelected ? " is-selected" : ""}`}
                            onClick={() => {
                              requestLayoutChange(layout.id);
                            }}
                          >
                            {layout.name}
                            {layout.premium ? " (Pro)" : ""}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {layoutUpgradeMessage ? <p className="status upgrade-hint">{layoutUpgradeMessage}</p> : null}

            <div className="color-theme-row">
              <span className="color-theme-label">Kleur:</span>
              <div className="color-theme-options">
                {selectedLayout.themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`color-swatch${colorThemeId === theme.id ? " is-active" : ""}`}
                    onClick={() => setColorThemeId(theme.id)}
                    title={theme.name}
                    style={
                      {
                        "--swatch-color": theme.accent,
                        "--swatch-paper": theme.paper
                      } as React.CSSProperties
                    }
                  >
                    <span className="color-swatch-dot" />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="preview-stage">
              {deferredRecipe ? (
                <div ref={previewRef}>
                  <RecipeCard recipe={activeRecipe ?? deferredRecipe} />
                </div>
              ) : (
                <div className={`layout-hero-preview layout-${selectedLayout.id}`}>
                  <div className="layout-hero-card">
                    <div className="layout-hero-render">
                      <RecipeCard recipe={{ ...layoutPreviewRecipe, colorThemeId }} />
                    </div>
                    <div className="layout-hero-watermark">Preview</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isConfirmingLayoutChange ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="confirm-modal">
            <h2 id="confirm-title">Ontwerp verlaten?</h2>
            <p>
              Weet je zeker dat je van layout wilt wisselen? Sla je ontwerp eerst op als je deze
              versie wilt bewaren.
            </p>
            <div className="actions">
              <button type="button" className="primary-button" onClick={confirmLayoutChange}>
                Ja, wissel layout
              </button>
              <button type="button" className="ghost-button" onClick={cancelLayoutChange}>
                Nee, blijf hier
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
