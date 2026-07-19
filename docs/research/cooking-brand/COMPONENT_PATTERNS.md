# Component Patterns — Editorial Cooking Brand

Anatomy adapted from NYT Cooking homepage patterns for Meal Prep UI.

## AppHeader

```
[ Wordmark (serif) ]     [ Nav links (sans) ]     [ Secondary ] [ Primary CTA ]
```

- Wordmark: product name in Source Serif 4, ~22–24px, not an NYT mark
- Nav: text links, muted → foreground on hover; no pill clusters
- Primary CTA: coral fill (`--accent`), white text, 4px radius
- Sticky optional; default in-flow with bottom hairline (`1px solid --border`)
- Mobile: wordmark + compact actions; nav can collapse to key links

## SectionHeading

```
DINNERS
─────────────────────────────
```

- Uppercase sans, bold, 12–13px, tracking wide
- Optional full-width hairline rule under or beside label
- One purpose per section; short supporting sentence allowed in muted text

## Button

| Variant | Fill | Text | Border |
|---------|------|------|--------|
| primary | `--accent` | white | none |
| secondary | transparent | `--foreground` | `--border` |
| ghost | transparent | `--foreground` | none |

- Padding ~`10px 18px`, font-size 14px, weight 600
- Disabled: 50% opacity
- Hover: `--accent-hover` for primary; light wash for secondary

## RecipeCard

```
┌─────────────────────┐
│                     │
│   EmptyPhoto / img  │  ← ~3:2 or 4:3
│              [Lock] │  ← overlay control bottom-right
├─────────────────────┤
│ Optional eyebrow    │  ← accent uppercase (e.g. GIRL LUNCH)
│ Meal title (serif)  │
│ 35 min · chicken    │  ← MetaRow
│ · tag · tag         │
│ ingredients (opt.)  │  ← quiet list, not a nested card
└─────────────────────┘
```

**INTERACTION MODEL:** click/tap on lock/favorite; hover darkens or scales photo slightly. Not scroll-driven.

## MetaRow

`{cookMinutes} min · {protein}` plus optional tags separated by middots. Color `--meta`, sans 13–14px.

## EmptyPhoto

When no image URL:

- Deterministic wash from name hash (`photo-wash-1/2/3`)
- Large serif monogram (first letter) centered at ~40% opacity
- Same aspect ratio as real photos so grids stay aligned

## Grocery panel

Quieter than recipe cards: section title in sans semibold, hairline top border, checkbox rows — **no** heavy bordered zinc boxes.
