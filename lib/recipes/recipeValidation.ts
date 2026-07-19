import type {
  CatalogRecipe,
  Dinner,
  LunchOption,
  MealKind,
  RecipeData,
  RecipeSource,
  SeasonCategory,
  RecipeStatus,
} from "@/lib/types";

const STATUSES: RecipeStatus[] = ["draft", "active", "archived"];
const KINDS: MealKind[] = ["dinner", "girl_lunch", "boy_lunch"];
const SEASON_CATEGORIES: (SeasonCategory | "none")[] = [
  "soup",
  "grill",
  "tacos",
  "pasta",
  "none",
];

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid ${field}: expected a non-empty string`);
  }
  return value.trim();
}

function requireScore(value: unknown, field: string, fallback: number): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`Invalid ${field}: expected an integer from 1 to 5`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid ${field}: expected an array of strings`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function parseStatus(value: unknown): RecipeStatus {
  if (value === undefined || value === null) return "active";
  if (typeof value !== "string" || !STATUSES.includes(value as RecipeStatus)) {
    throw new Error(`Invalid status: expected draft, active, or archived`);
  }
  return value as RecipeStatus;
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${field}: expected a boolean`);
  }
  return value;
}

function parseKind(value: unknown): MealKind {
  if (typeof value !== "string" || !KINDS.includes(value as MealKind)) {
    throw new Error(`Invalid kind: expected dinner, girl_lunch, or boy_lunch`);
  }
  return value as MealKind;
}

function parseSeasonCategory(value: unknown): SeasonCategory | "none" | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== "string" ||
    !SEASON_CATEGORIES.includes(value as SeasonCategory | "none")
  ) {
    throw new Error("Invalid seasonCategory: expected soup, grill, tacos, pasta, or none");
  }
  return value as SeasonCategory | "none";
}

function parseSource(value: unknown): RecipeSource | undefined {
  if (value === undefined || value === null) return undefined;
  if (!value || typeof value !== "object") {
    throw new Error("Invalid source: expected an object");
  }
  const body = value as Record<string, unknown>;
  const type = body.type;
  if (type !== "manual" && type !== "tiktok" && type !== "other") {
    throw new Error("Invalid source.type");
  }
  const url = body.url;
  if (url !== undefined && (typeof url !== "string" || url.length === 0)) {
    throw new Error("Invalid source.url");
  }
  return { type, url: typeof url === "string" ? url : undefined };
}

export function parseCatalogRecipeInput(
  input: unknown,
  options?: { requireId?: boolean }
): CatalogRecipe {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid recipe: expected an object");
  }
  const body = input as Record<string, unknown>;
  const kind = parseKind(body.kind);
  const id =
    options?.requireId === false && (body.id === undefined || body.id === "")
      ? slugify(requireString(body.name, "name"))
      : requireString(body.id, "id");

  const recipe: CatalogRecipe = {
    id,
    kind,
    name: requireString(body.name, "name"),
    tags: requireStringArray(body.tags, "tags"),
    ingredients: requireStringArray(body.ingredients, "ingredients"),
    instructions: requireStringArray(body.instructions, "instructions"),
    status: parseStatus(body.status),
    favorite: Boolean(body.favorite),
    effortScore: requireScore(body.effortScore, "effortScore", 3),
    noveltyScore: requireScore(body.noveltyScore, "noveltyScore", 3),
    wildcard: parseOptionalBoolean(body.wildcard, "wildcard"),
    seasonCategory: parseSeasonCategory(body.seasonCategory),
    source: parseSource(body.source) ?? { type: "manual" },
  };

  if (kind === "dinner") {
    recipe.protein = requireString(body.protein, "protein");
    const cookMinutes = body.cookMinutes;
    if (typeof cookMinutes !== "number" || !Number.isInteger(cookMinutes) || cookMinutes < 1) {
      throw new Error("Invalid cookMinutes: expected a positive integer");
    }
    recipe.cookMinutes = cookMinutes;
  } else {
    if (typeof body.protein === "string" && body.protein.trim()) {
      recipe.protein = body.protein.trim();
    }
    if (typeof body.cookMinutes === "number" && Number.isInteger(body.cookMinutes)) {
      recipe.cookMinutes = body.cookMinutes;
    }
  }

  return recipe;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function toDinner(recipe: CatalogRecipe): Dinner {
  return {
    id: recipe.id,
    name: recipe.name,
    protein: recipe.protein ?? "varies",
    cookMinutes: recipe.cookMinutes ?? 30,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    status: recipe.status,
    favorite: recipe.favorite,
    effortScore: recipe.effortScore,
    noveltyScore: recipe.noveltyScore,
    wildcard: recipe.wildcard,
    seasonCategory: recipe.seasonCategory,
    instructions: recipe.instructions,
    source: recipe.source,
  };
}

export function recipeToPlannerViews(
  recipes: CatalogRecipe[],
  servings: number,
  options?: { includeArchived?: boolean }
): RecipeData {
  const pool = options?.includeArchived
    ? recipes
    : recipes.filter((recipe) => recipe.status === "active");
  return {
    servings,
    dinners: pool.filter((recipe) => recipe.kind === "dinner").map(toDinner),
    girlLunches: pool
      .filter((recipe) => recipe.kind === "girl_lunch")
      .map(toLunch),
    boyLunches: pool
      .filter((recipe) => recipe.kind === "boy_lunch")
      .map(toLunch),
  };
}

function toLunch(recipe: CatalogRecipe): LunchOption {
  return {
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.ingredients,
    status: recipe.status,
    favorite: recipe.favorite,
    effortScore: recipe.effortScore,
    noveltyScore: recipe.noveltyScore,
    instructions: recipe.instructions,
    source: recipe.source,
    tags: recipe.tags,
  };
}

export function legacyRecipeDataToCatalog(data: RecipeData): CatalogRecipe[] {
  return [
    ...data.dinners.map((dinner) =>
      parseCatalogRecipeInput({
        ...dinner,
        kind: "dinner",
        instructions: dinner.instructions ?? [],
        status: dinner.status ?? "active",
        favorite: dinner.favorite ?? false,
        effortScore: dinner.effortScore ?? 3,
        noveltyScore: dinner.noveltyScore ?? 3,
        source: dinner.source ?? { type: "manual" },
      })
    ),
    ...data.girlLunches.map((lunch) =>
      parseCatalogRecipeInput({
        ...lunch,
        kind: "girl_lunch",
        tags: lunch.tags ?? [],
        instructions: lunch.instructions ?? [],
        status: lunch.status ?? "active",
        favorite: lunch.favorite ?? false,
        effortScore: lunch.effortScore ?? 3,
        noveltyScore: lunch.noveltyScore ?? 3,
        source: lunch.source ?? { type: "manual" },
      })
    ),
    ...data.boyLunches.map((lunch) =>
      parseCatalogRecipeInput({
        ...lunch,
        kind: "boy_lunch",
        tags: lunch.tags ?? [],
        instructions: lunch.instructions ?? [],
        status: lunch.status ?? "active",
        favorite: lunch.favorite ?? false,
        effortScore: lunch.effortScore ?? 3,
        noveltyScore: lunch.noveltyScore ?? 3,
        source: lunch.source ?? { type: "manual" },
      })
    ),
  ];
}
