export type Dinner = {
  id: string;
  name: string;
  protein: string;
  cookMinutes: number;
  tags: string[];
  ingredients: string[];
};

export type LunchOption = {
  id: string;
  name: string;
  ingredients: string[];
};

export type RecipeData = {
  servings: number;
  dinners: Dinner[];
  girlLunches: LunchOption[];
  boyLunches: LunchOption[];
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
