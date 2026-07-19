import type { CustomDinner, Dinner, DinnerSlot } from "./types";

/** Legacy history stored `dinners` as plain recipe id strings. */
export function coerceDinnerSlot(value: DinnerSlot | string): DinnerSlot {
  if (typeof value === "string") {
    return { type: "recipe", recipeId: value };
  }
  return value;
}

export function coerceDinnerSlots(values: (DinnerSlot | string)[]): DinnerSlot[] {
  return values.map(coerceDinnerSlot);
}

/** The id used for locking/unlocking this slot: a recipe id or a custom slot id. */
export function dinnerSlotId(slot: DinnerSlot): string {
  return slot.type === "recipe" ? slot.recipeId : slot.custom.id;
}

export function customDinnerToDinner(custom: CustomDinner): Dinner {
  return {
    id: custom.id,
    name: custom.name,
    protein: custom.protein ?? "varies",
    cookMinutes: custom.cookMinutes ?? 0,
    tags: ["custom"],
    ingredients: custom.ingredients,
  };
}
