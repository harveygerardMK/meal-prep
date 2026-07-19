export type RecipeStatus = "draft" | "active" | "archived";
export type MealKind = "dinner" | "girl_lunch" | "boy_lunch";
export type SeasonCategory = "soup" | "grill" | "tacos" | "pasta";

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
  seasonCategory?: SeasonCategory | "none";
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
  seasonCategory?: SeasonCategory | "none";
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

export type WeekPreferences = {
  cookEffortTarget: number;
  noveltyTarget: number;
};

export type Settings = {
  dinnersPerWeek: number;
  maxCookMinutes: number;
  noRepeatWeeks: number;
  servings: number;
  cookEffortTarget: number;
  noveltyTarget: number;
  includeStaplesInGroceryList: boolean;
};

export type GrocerySectionName =
  | "Produce"
  | "Meat & Seafood"
  | "Dairy & Eggs"
  | "Bakery & Bread"
  | "Frozen"
  | "Pantry & Dry Goods"
  | "Other";

export type StapleItem = {
  id: string;
  name: string;
  section: GrocerySectionName;
};

export type StaplesData = {
  items: StapleItem[];
};

export type Locks = {
  /** Each entry is a recipe id, a custom slot id (`custom:<uuid>`), or null when unlocked. */
  dinners: (string | null)[];
  girlLunch: string | null;
  boyLunch: string | null;
};

/** Ad hoc dinner entered by hand — never written to the recipe catalog. */
export type CustomDinner = {
  /** Opaque slot id, e.g. `custom:<uuid>` — NOT a catalog id. */
  id: string;
  name: string;
  ingredients: string[];
  cookMinutes?: number;
  protein?: string;
};

export type DinnerSlot =
  | { type: "recipe"; recipeId: string }
  | { type: "custom"; custom: CustomDinner };

/** Body for setting an ad hoc custom dinner into a plan slot. */
export type CustomDinnerInput = {
  index: number;
  name: string;
  ingredients: string[];
  cookMinutes?: number;
  protein?: string;
};

/** Household add-ons for the week (paper towels, snacks, etc.). */
export type MiscGroceryItem = {
  id: string;
  name: string;
  note?: string;
  addedAt: string;
};

export type WeekPlan = {
  weekOf: string;
  dinners: DinnerSlot[];
  girlLunch: string;
  boyLunch: string;
  locks: Locks;
  preferences?: WeekPreferences;
  miscGrocery?: MiscGroceryItem[];
  confirmed?: boolean;
  confirmedAt?: string;
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
  preferences: WeekPreferences;
  miscGrocery: MiscGroceryItem[];
  confirmed: boolean;
  confirmedAt?: string;
};
