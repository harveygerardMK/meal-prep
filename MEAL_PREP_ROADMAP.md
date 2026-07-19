# Meal prep: history analysis + next features

Handoff doc for continuing this build in Cursor. Part 1 is the full data summary
behind every recommendation below. Part 2 is five feature specs, each tied back
to a specific finding. Nothing here is implemented — it's scoped for someone
(or an AI pair) working directly in the codebase to build.

## Current app, for context

Next.js App Router app, no external database. Key files:

- `data/recipes.json` — seed data: `dinners[]`, `girlLunches[]`, `boyLunches[]`
- `data/settings.json` — `dinnersPerWeek`, `maxCookMinutes`, `noRepeatWeeks`, `servings`
- `data/history.json` — one `WeekPlan` per week actually generated (`weekOf`, `dinners[]`, `girlLunch`, `boyLunch`, `locks`)
- `lib/planGenerator.ts` — picks each week's meals, avoiding recent repeats, saves to history
- `lib/groceryList.ts` — aggregates ingredients across the week's dinners + lunches, groups by store section
- `lib/dataStore.ts` — reads/writes the JSON files (local disk; not durable if deployed serverless — flagged in the file already)
- `app/page.tsx` — home page: this week's plan, lock/regenerate, grocery list
- `app/settings/page.tsx` — editable household settings
- `app/api/plan/route.ts`, `app/api/settings/route.ts` — the two API routes backing those pages

Current seed library has **34 dinners** and **5 girl-lunch / 5 boy-lunch options**.
Dinner ids already in use (so new ones don't collide): `chicken-salad`, `tacos`,
`leftovers-night`, `szechuan-noodles`, `cacio-e-pepe`, `garlic-ramen`,
`sloppy-joes-tots`, `thai-meatball-soup`, `chicken-enchiladas`,
`chicken-noodle-soup`, `lasagna`, `lettuce-wraps`, `carne-asada`, `keema-naan`,
`stir-fry`, `mezze-bowl`, `burrito-bowls`, `chicken-picatta`,
`pork-tenderloin-carrots`, `steak-pots-arugula`, `gnocchi-sausage-peppers`,
`shoyu-chicken`, `corn-chowder`, `french-onion-soup`,
`chicken-caesar-crispy-chickpeas`, `air-fryer-sesame-chicken`,
`spaghetti-garlic-bread`, `flank-steak-asparagus`, `fajitas`, `beef-broccoli`,
`turkish-pasta`, `baked-salmon-veggies`, `shrimp-scampi`,
`airfryer-tilapia-asparagus`.

---

## Part 1 — Data summary (source of every recommendation below)

**Source:** the "Food" list in the family's Trello board export, 375 cards
total, 290 identified as dated weekly meal/grocery plans. Dates were decoded
from each card's Trello object ID (the first 8 hex characters encode a Unix
timestamp) rather than parsed from the card title, since titles used at least
six different date notations across 8 years (`3.17`, `4.14 Meals`,
`8/21 Meals`, `Week 5/1 Groceries`...).

### Headline numbers

| Metric | Value |
|---|---|
| Weekly plans logged | 290 |
| Date range | Apr 2017 – Jul 2025 (8.3 years) |
| Individual dinner entries logged | 902 |
| Average gap between logged weeks | 10.4 days (vs. a 7-day target) |
| Cards per year | see cadence table below |

### Cadence — cards logged per year

| Year | Cards |
|---|---|
| 2017 | 23 |
| 2018 | 34 |
| 2019 | 41 |
| 2020 | 45 |
| 2021 | 42 |
| 2022 | 33 |
| 2023 | 33 |
| 2024 | 27 |
| 2025 | 12 (partial year — data stops in July) |

**This is the single most important finding.** The logging habit was steady at
30–45 weeks/year from 2018–2023, then fell to 27 in 2024 and only 12 in 2025.
The planning habit itself became unpredictable — presumably the actual reason
an automated tool was worth building. Any "predictability" feature should be
judged against whether it prevents this same decay from happening to the new
app's habit loop.

### Protein / category mix (mentions across ~900 logged dinners; a dish can match more than one tag)

| Category | Mentions |
|---|---|
| Chicken | 246 |
| Pasta | 103 |
| Steak / beef | 80 |
| Soup | 59 |
| Bowl / mezze | 37 |
| Tacos / Mexican | 31 |
| Pork | 22 |
| Fish / seafood | 21 |
| Turkey | 15 |
| Sausage | 11 |

### Top 10 repeat dinners (ranked by distinct weeks appeared)

| Rank | Dish | Count | Notes |
|---|---|---|---|
| 1 | Chicken salad | 13x | Likely undercounted — see "Sally" quirk below |
| 2 | Tacos | 11x | |
| 3 | Szechuan noodles | 11x | Merged from "szechuan noods" (7x) + "szechuan noodles" (4x) — same dish, two spellings |
| 4 | Leftovers night | 8x | |
| 5 | Cacio e pepe | 7x | |
| 6 | Spaghetti | 6x | |
| 7 | Garlic ramen | 6x | |
| 8 | Sloppy joes & tots | 6x | |
| 9 | Thai meatball soup | 5x | |
| 10 | Taco cups | 4x | Not currently in the app's recipe library |

### Seasonality — monthly mention counts, all years combined (0–15 scale)

| Category | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Peak |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Soup | 7 | 4 | 7 | 3 | 1 | 0 | 2 | 3 | 6 | 12 | 7 | 6 | Oct |
| Grill / steak | 5 | 8 | 14 | 13 | 9 | 14 | 13 | 6 | 3 | 10 | 2 | 2 | Mar (tied Jun) |
| Tacos | 8 | 5 | 9 | 5 | 5 | 6 | 7 | 2 | 5 | 6 | 4 | 7 | Mar |
| Pasta | 8 | 6 | 12 | 11 | 5 | 11 | 9 | 9 | 9 | 9 | 6 | 5 | Mar |

Soup and grilling trade places almost exactly across the calendar. Pasta is
close to flat year-round — a true staple with no real seasonality.

### Recipe sourcing habits

| Source | Count |
|---|---|
| Physical cookbook (page reference, e.g. "pg. 117") | 35 |
| Other web link | 35 |
| NYT Cooking | 7 |
| Epicurious | 2 |
| TikTok | 1 (likely undercounted — several entries note "(TikTok)" as a parenthetical without pasting a link) |

Only about 9% of logged dinners cite any source at all — most weeks are just
a dish name written from memory or habit.

### Freezer inventory notes, by year

| Year | Notes logged |
|---|---|
| 2017 | 1 |
| 2018 | 1 |
| 2019 | 1 |
| 2020 | 0 |
| 2021 | 0 |
| 2022 | 0 |
| 2023 | 15 |
| 2024 | 15 |
| 2025 | 5 (partial year) |

Freezer tracking was essentially nonexistent until 2023, then became a weekly
fixture. A real behavior change, not noise.

### Girl-lunch logging, by year

| Year | Entries |
|---|---|
| 2017–2020 | 0 |
| 2021 | 2 |
| 2022 | 3 |
| 2023 | 5 |
| 2024 | 6 |
| 2025 | 4 (partial year) |

Only starts in 2021 (school lunches beginning, most likely) and has held
steady since. Boy-lunch was never logged in Trello at all — the app's
boy-lunch options are invented, not historical (flagged when first built).

### Recipe library coverage

Of the 40 historically-repeated dinners (2+ appearances), **24 are already in
the app's seed library**. The other 16 aren't all real gaps — some are the
"Sally" naming quirk (below), and one ("smartcardinline") is a Trello
link-embed parsing artifact, not a dish. After filtering noise, here's what's
genuinely missing:

| Dish | Historical count | Suggested ingredients |
|---|---|---|
| Grilled cheese & tomato soup | 2x | Sandwich bread, sliced cheddar, butter, canned tomato soup, heavy cream |
| Gnocchi Sally (pan-fried, arugula, feta) | 1x | Potato gnocchi, arugula, feta, lemon, olive oil — distinct from the existing sausage-and-peppers gnocchi dish |
| Eamon & Bec gnocchi soup | 3x | Potato gnocchi, chicken or veg broth, kale or spinach, italian sausage, parmesan |
| Kielbasa soup | 2x | Kielbasa, potatoes, cabbage or kale, chicken broth, smoked paprika |
| Lemon butter chicken & orzo | 2x | Chicken breast, orzo, lemon, butter, parmesan, spinach |
| Tamales | 2x | Masa, pork or chicken filling, corn husks, red or green sauce |
| Dumplings | 2x | Ground pork, wonton wrappers, ginger, scallion, soy sauce, sesame oil |
| Brats & corn on the cob | 2x | Bratwurst, buns, corn on the cob, butter |
| Adobo cauliflower | 2x | Cauliflower florets, soy sauce, vinegar, garlic, bay leaf |
| Taco cups | 4x | Wonton or tortilla cups, ground beef, taco seasoning, cheese, salsa |
| Udon | 3x | Udon noodles, dashi or broth, soy sauce, mirin, scallion, soft-boiled egg |

### The "Sally" quirk

Your family has used **"Sally" as shorthand for "salad"** consistently across
8 years — "Chicken Sally," "Steak Sally," "Gnocchi Sally," even "Arugula Sally
Soo." It's a real household word, not a typo, and it means every count above
that touches a salad dish is a slight undercount, since automated text
matching doesn't merge "sally" and "salad."

### Untried recipe bookmarks (candidate pool for the "wildcard" feature, Part 2E)

From the "Future Meal Prep Ideas" Trello card — links saved but, as far as the
logged dinner history shows, never actually cooked:

- Momofuku spicy pork sausage rice cakes — `https://peachykeen.momofuku.com/recipe/spicy-pork-sausage-rice-cakes/`
- Gado gado salad with peanut sauce (Vice) — `https://www.vice.com/en/article/93w5v7/gado-gado-salad-with-peanut-sauce-recipe`
- NYT's 50 most popular recipes of 2020 — `https://www.nytimes.com/2020/12/12/admin/our-50-most-popular-recipes-of-2020.html`
- Epicurious's most popular recipes of 2020 — `https://www.epicurious.com/recipes-menus/most-popular-recipes-of-2020-gallery`
- Arugula soup (Jennifer Fisher Jewelry blog) — `https://jenniferfisherjewelry.com/blogs/jf-kitchen/arugula-soup`

These are link bookmarks, not full recipes — someone needs to actually read
each one and write it up as a real recipe entry before it can go in the
wildcard pool.

---

## Part 2 — Feature specs

### 2A. Grocery list staples (easier)

**Why:** The Trello grocery checklist was full of items that aren't tied to
any specific dish — milk, eggs, bread, produce that gets eaten as snacks. The
app's grocery list is currently built entirely from that week's picked
recipes, so none of that gets captured.

**What to build:**
- A new `data/staples.json`: a flat list of `{ name, section }` items (section
  matching the categories already used in `groceryList.ts` — Produce, Dairy &
  Eggs, Pantry & Dry Goods, etc.).
- A toggle in Settings ("Include household staples in grocery list," on by
  default) stored on the `Settings` object.
- When building the grocery list, if the toggle is on, merge the staples list
  in alongside the recipe-derived ingredients, using the same section grouping
  — so staples show up as ordinary checkable items, not a separate special
  section.
- A way to edit the staples list itself — either a simple settings-page text
  list (one item per line) or a dedicated small "Staples" section on the
  Settings page.

**Acceptance criteria:**
- Turning the toggle off removes staples from the list without affecting
  recipe-derived items.
- Editing the staples list persists and reflects on the next grocery list
  view/regeneration.
- Staples appear in the correct store section, not lumped into "Other."

### 2B. Ad hoc / freeform meal entry (easier)

**Why:** 91% of logged dinners were just a dish name typed from memory — no
recipe, no source, no structure. The app currently requires every dinner to
exist as a full entry in `recipes.json` with an ingredient list. That's more
structure than the household actually used historically, and it blocks "just
put whatever we're actually making that week" the way Trello allowed.

**What to build:**
- On the home page, each dinner slot gets an alternate "type your own" input
  next to Lock/Regenerate — typing a name and hitting enter/save fills that
  slot with a one-off custom meal instead of a picked recipe.
- Custom meals need at minimum a name; ingredients optional (a free-text
  textarea, one ingredient per line, matching the plain-string ingredient
  format already used elsewhere).
- Custom meals should NOT get written into `recipes.json` (they're one-offs,
  not permanent library entries) — but they DO need to be represented in that
  week's `WeekPlan`/history entry so the grocery list can include their
  ingredients if provided, and so "recently used" tracking doesn't collide
  with real recipe ids.
- If no ingredients are given for a custom meal, it simply contributes nothing
  to the grocery list (matches how "Leftovers Night" already works today with
  an empty ingredients array).

**Acceptance criteria:**
- A custom-named dinner can be locked, survives regeneration of the other
  slots, and appears correctly in the grocery list if ingredients were given.
- Custom meals never appear in a future week's "avoid repeats" pool tied to
  the general recipe library (they're not searchable/repeatable recipes,
  just one-off notes) — though nothing prevents the same custom text being
  typed again another week.

### 2C. Seed the missing dishes (exciting)

**Why:** The 11 dishes in the coverage table above are real family favorites
that were cooked multiple times over 8 years but never made it into the app's
34-dish seed library. Adding them is pure upside — no new mechanism, just
filling a known gap so the plan generator has more of the household's actual
history to draw from.

**What to build:**
- Add all 11 dishes from the coverage table to `data/recipes.json`'s
  `dinners` array, using the suggested ingredients as a starting point (adjust
  quantities/wording to match the existing style in that file — e.g.
  `"1 lb ground pork"` not just `"ground pork"`).
- Assign each a `protein` tag and a `cookMinutes` estimate consistent with the
  existing entries, and reuse the id-naming convention already in place
  (kebab-case, e.g. `grilled-cheese-tomato-soup`).

**Acceptance criteria:**
- All 11 new dinners appear as valid candidates in a regenerated plan (i.e.
  they show up in rotation, not just sitting unused in the JSON).

### 2D. Seasonal weighting in the plan generator (exciting)

**Why:** The plan generator currently optimizes only for protein variety and
no-repeats — it has no concept of season, even though the historical data
shows a strong, consistent seasonal pattern (soup peaks in October, grilling
peaks in spring).

**What to build:**
- Add a `seasonCategory` tag to relevant dinners in `recipes.json` — one of
  `soup`, `grill`, `tacos`, `pasta`, or omitted/`none` for dishes that don't
  fit one of the four tracked categories.
- In `lib/planGenerator.ts`'s selection logic, apply a seasonal multiplier to
  a dinner's selection weight based on the current month, derived from the
  seasonality table in Part 1 (e.g. `soup` dinners get boosted roughly
  Sep–Jan, `grill` dinners boosted roughly Mar–Jul, using the monthly counts
  above as a rough guide to *when* the boost applies — exact curve/strength is
  an implementation judgment call, not something the data prescribes
  precisely).
- This should be a soft nudge, not a hard filter — protein-variety and
  no-repeat rules still apply; season just tilts the odds among otherwise
  eligible candidates.

**Acceptance criteria:**
- Regenerating a plan in, say, November noticeably favors soup over grilled
  dishes more often than in June, without ever fully excluding either
  category.

### 2E. Monthly "wildcard" slot (exciting)

**Why:** The household clearly bookmarks recipes with intent to try them
(the "Future Meal Prep Ideas" Trello card) but the logged dinner history shows
none of them were ever actually cooked. Left alone, the plan generator will
only ever reinforce the existing rotation — it has no mechanism to introduce
something genuinely new.

**What to build:**
- A `wildcard: true` flag (or a separate small `wildcards` array) for recipes
  that haven't been cooked yet — seeded initially from the bookmark list in
  Part 1 once someone writes those links up as real recipes with ingredients.
- Once a month (e.g. the first week generated in a new calendar month, or
  simply every 4th week — pick whichever is simpler to implement against the
  existing `weekOf` tracking), have one dinner slot draw specifically from the
  wildcard pool instead of the normal rotation, bypassing the "avoid recent
  repeats" logic since by definition it hasn't been used recently.
- After a wildcard recipe is picked once, flip its flag so it graduates into
  the normal rotation pool for future weeks (it's no longer "untried").

**Acceptance criteria:**
- Exactly one dinner per wildcard-eligible week is drawn from the wildcard
  pool; the other slots behave exactly as before.
- A wildcard recipe, once selected, is treated as an ordinary recipe in all
  future weeks (normal repeat-avoidance applies to it going forward).
- If the wildcard pool is empty, that week simply falls back to normal
  selection for all slots (no error).

### 2F. Weekly "confirm this week" ritual (predictable)

**Why:** The single biggest finding in this whole analysis is that the
household's Trello logging habit — the exact same kind of weekly ritual this
app now automates — decayed from 30–45 logged weeks/year down to 12. An
automated generator removes the *effort* of planning, but it doesn't
automatically create a habit of actually looking at the plan every week. A
generated-but-ignored plan is just as much a failure mode as a never-written
Trello card.

**What to build:**
- Add a `confirmed: boolean` (default `false`) to `WeekPlan` in
  `data/history.json`.
- A "Confirm this week's plan" action on the home page, separate from
  Lock/Regenerate, that marks the current week confirmed.
- Light visual treatment on the home page distinguishing "confirmed" vs.
  "not yet confirmed" for the current week — a small status pill is enough,
  nothing heavy-handed.
- Optional/bigger lift, flag but don't build yet: a reminder mechanism (e.g. a
  Sunday nudge) would need the app to be reachable outside of someone opening
  it manually, which depends on how/whether this gets deployed — out of scope
  until hosting is decided.

**Acceptance criteria:**
- Confirming persists across reloads and regenerating an *unconfirmed* plan
  works exactly as today; regenerating a plan that's already been confirmed
  should reset it to unconfirmed (a changed plan needs re-confirming).

---

## Suggested build order

1. **2C — seed missing dishes.** Pure data, zero logic changes, immediate value.
2. **2A — staples list.** Small, contained, mostly new data + one settings toggle.
3. **2F — confirm ritual.** Small UI + one new field; no dependency on anything else.
4. **2B — ad hoc meal entry.** Self-contained but touches the plan/history shape a bit more.
5. **2D — seasonal weighting.** Needs the new `seasonCategory` tagging pass across existing recipes first.
6. **2E — wildcard slot.** Depends on someone actually writing up the bookmarked recipes first — the slowest part isn't code, it's authoring real recipes from those 5 links.
