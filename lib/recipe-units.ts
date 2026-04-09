const UNIT_LABELS: Record<string, { singular: string; plural: string }> = {
  g: { singular: "g", plural: "g" },
  kg: { singular: "kg", plural: "kg" },
  l: { singular: "l", plural: "l" },
  ml: { singular: "ml", plural: "ml" },
  stuk: { singular: "stuk", plural: "stuks" },
  hand: { singular: "hand", plural: "handen" },
  schep: { singular: "schep", plural: "scheppen" },
  theelepel: { singular: "theelepel", plural: "theelepels" },
  eetlepel: { singular: "eetlepel", plural: "eetlepels" }
};

const UNIT_ALIASES: Record<string, string> = {
  st: "stuk",
  stuks: "stuk",
  stuk: "stuk",
  hand: "hand",
  handen: "hand",
  schep: "schep",
  scheppen: "schep",
  tl: "theelepel",
  theelepel: "theelepel",
  theelepels: "theelepel",
  el: "eetlepel",
  eetlepel: "eetlepel",
  eetlepels: "eetlepel",
  g: "g",
  gr: "g",
  kg: "kg",
  l: "l",
  ml: "ml"
};

export const FORM_UNIT_OPTIONS = [
  { value: "", label: "Kies eenheid" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "l", label: "l" },
  { value: "ml", label: "ml" },
  { value: "theelepel", label: "theelepel" },
  { value: "eetlepel", label: "eetlepel" },
  { value: "stuk", label: "stuk" },
  { value: "schep", label: "schep" },
  { value: "hand", label: "hand" }
] as const;

export function normalizeUnit(unit: string) {
  const cleaned = unit.trim().toLowerCase();
  return UNIT_ALIASES[cleaned] ?? cleaned;
}

function parseNumericAmount(amount: string) {
  const cleaned = amount.trim().replace(",", ".");
  if (!cleaned) {
    return null;
  }

  if (cleaned.includes("/")) {
    const [numerator, denominator] = cleaned.split("/");
    const num = Number(numerator);
    const den = Number(denominator);

    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return num / den;
    }
  }

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatUnitForAmount(amount: string, unit: string) {
  const normalizedUnit = normalizeUnit(unit);
  if (!normalizedUnit) {
    return "";
  }

  const labels = UNIT_LABELS[normalizedUnit];
  if (!labels) {
    return normalizedUnit;
  }

  const numericAmount = parseNumericAmount(amount);
  if (numericAmount === null) {
    return labels.singular;
  }

  return numericAmount > 1 ? labels.plural : labels.singular;
}

export function formatQuantity(amount: string, unit: string) {
  const normalizedAmount = amount.trim().replace(".", ",");
  const displayUnit = formatUnitForAmount(normalizedAmount, unit);
  return `${normalizedAmount} ${displayUnit}`.trim() || "-";
}

export function formatServingsLabel(servings: string) {
  const cleaned = servings.trim();
  if (!cleaned) {
    return "";
  }

  if (cleaned === "1") {
    return "Voor 1 portie";
  }

  return `Voor ${cleaned} porties`;
}
