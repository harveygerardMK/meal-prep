export type RecipeStatus = "draft" | "active" | "archived";
export type MealKind = "dinner" | "girl_lunch" | "boy_lunch";

export type RecipeSource = {
  type: "manual" | "tiktok" | "other";
  url?: string;
};

export type CatalogRecipe = {
  id: string;
  kind: MealKind;
  name: string;
  protein?: string;
  cookMinutes?: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  status: RecipeStatus;
  favorite: boolean;
  effortScore: number;
  noveltyScore: number;
  source?: RecipeSource;
};

export type Dinner = {
  id: string;
  name: string;
  protein: string;
  cookMinutes: number;
  tags: string[];
  ingredients: string[];
  status?: RecipeStatus;
  favorite?: boolean;
  effortScore?: number;
  noveltyScore?: number;
  instructions?: string[];
  source?: RecipeSource;
};

export type LunchOption = {
  id: string;
  name: string;
  ingredients: string[];
  status?: RecipeStatus;
  favorite?: boolean;
  effortScore?: number;
  noveltyScore?: number;
  instructions?: string[];
  source?: RecipeSource;
  tags?: string[];
};

/** Legacy planner-facing shape derived from the catalog. */
export type RecipeData = {
  servings: number;
  dinners: Dinner[];
  girlLunches: LunchOption[];
  boyLunches: LunchOption[];
};

export type CatalogData = {
  schemaVersion: 2;
  servings: number;
  recipes: CatalogRecipe[];
};

export type Settings = {
  dinnersPerWeek: number;
  maxCookMinutes: number;
  noRepeatWeeks: number;
  servings: number;
};

export type Locks = {
  dinners: (string | null)[];
  girlLunch: string | null;
  boyLunch: string | null;
};

export type WeekPlan = {
  weekOf: string;
  dinners: string[];
  girlLunch: string;
  boyLunch: string;
  locks: Locks;
};

export type History = {
  weeks: WeekPlan[];
};

export type ResolvedWeekPlan = {
  weekOf: string;
  dinners: Dinner[];
  girlLunch: LunchOption;
  boyLunch: LunchOption;
  locks: Locks;
};
