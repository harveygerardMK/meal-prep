import type { ResolvedWeekPlan } from "./types";

export type GroceryEntry = { text: string; source: string };
export type GroceryItem = { name: string; entries: GroceryEntry[] };
export type GrocerySection = { section: string; items: GroceryItem[] };

const SECTION_ORDER = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery & Bread",
  "Frozen",
  "Pantry & Dry Goods",
  "Other",
] as const;

const SECTION_KEYWORDS: [string, RegExp][] = [
  [
    "Meat & Seafood",
    /\b(chicken|beef|pork|steak|sausage|turkey|salmon|shrimp|tilapia|meatball|bacon|lamb)\b/i,
  ],
  [
    "Dairy & Eggs",
    /\b(cheese|cheddar|mozzarella|parmesan|pecorino|ricotta|feta|gruyere|yogurt|cream|milk|egg|eggs|babybel|butter)\b/i,
  ],
  ["Bakery & Bread", /\b(bread|bun|buns|baguette|naan|tortilla|pita|croissant)\b/i],
  ["Frozen", /\b(frozen|tots|nuggets)\b/i],
  [
    "Produce",
    /\b(onion|garlic|pepper|potato|potatoes|carrot|celery|broccoli|asparagus|lettuce|romaine|spinach|arugula|cucumber|tomato|tomatoes|avocado|lime|lemon|cilantro|parsley|scallion|ginger|thyme|rosemary|dill|apple|grape|grapes|corn|green beans)\b/i,
  ],
  [
    "Pantry & Dry Goods",
    /\b(pasta|noodles|spaghetti|linguine|rice|ramen|beans|chickpeas|marinara|sauce|broth|stock|oil|vinegar|seasoning|curry|sugar|flour|crackers|soy sauce|hoisin|coconut milk|falafel|honey|peas|glaze|dressing|hummus|tzatziki|salsa|sour cream|mayo|jelly|peanut butter)\b/i,
  ],
];

function coreName(ingredientText: string): string {
  let s = ingredientText.split(",")[0];
  s = s.replace(
    /^[\d/.\s]+(cups?|tbsp|tablespoons?|tsp|teaspoons?|lbs?|pounds?|oz|ounces?|cans?|cloves?|heads?|bunch(?:es)?|slices?|packs?|in|inch|loaf|loaves|jars?|bags?|boxes?)?\s*/i,
    ""
  );
  s = s.replace(/^[\d]+(\/[\d]+)?\s*/, "");
  return s.toLowerCase().trim() || ingredientText.toLowerCase().trim();
}

function categorize(name: string): string {
  for (const [section, pattern] of SECTION_KEYWORDS) {
    if (pattern.test(name)) return section;
  }
  return "Other";
}

export function buildGroceryList(plan: ResolvedWeekPlan): GrocerySection[] {
  const entries: { text: string; source: string }[] = [];

  for (const dinner of plan.dinners) {
    for (const ing of dinner.ingredients) {
      entries.push({ text: ing, source: dinner.name });
    }
  }
  for (const ing of plan.girlLunch.ingredients) {
    entries.push({ text: ing, source: `${plan.girlLunch.name} (Girl lunch ×5)` });
  }
  for (const ing of plan.boyLunch.ingredients) {
    entries.push({ text: ing, source: `${plan.boyLunch.name} (Boy lunch ×5)` });
  }

  const grouped = new Map<string, GroceryItem>();
  for (const entry of entries) {
    const key = coreName(entry.text);
    if (!grouped.has(key)) {
      grouped.set(key, { name: key.charAt(0).toUpperCase() + key.slice(1), entries: [] });
    }
    grouped.get(key)!.entries.push(entry);
  }

  const bySection = new Map<string, GroceryItem[]>();
  for (const item of grouped.values()) {
    const section = categorize(item.name);
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(item);
  }
  for (const items of bySection.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  return SECTION_ORDER.filter((s) => bySection.has(s)).map((section) => ({
    section,
    items: bySection.get(section)!,
  }));
}
