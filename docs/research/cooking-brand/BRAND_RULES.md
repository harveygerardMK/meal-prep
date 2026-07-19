# Brand Rules — Editorial Cooking

Checklist for every new page and feature.

## Do

- Use **Source Serif 4** for page titles and meal/recipe names
- Use **Source Sans 3** for UI chrome, meta, forms, buttons
- Use **coral accent** (`--accent`) for primary CTAs and eyebrows only
- Prefer **photo-first** meal/recipe presentation (`RecipeCard` + `EmptyPhoto`)
- Keep layouts on a **white canvas** with hairline rules
- Put lock / favorite controls on the photo overlay (or adjacent meta), not as amber pills
- One job per section; serif H1 + short muted support line

## Don’t

- Don’t use NYT / NYT Cooking logos, wordmarks, or proprietary fonts
- Don’t copy NYT recipe copy, ratings, or photography
- Don’t invent **fake star ratings**
- Don’t default to zinc `rounded-xl border` utility cards
- Don’t use purple gradients, glow, cream+terracotta AI defaults, or dark-mode-first chrome
- Don’t overload the first viewport with stats strips or promo chips

## Mapping: lock vs favorite

| Affordance | Meaning | Visual |
|------------|---------|--------|
| Lock | Keep this meal when regenerating the week | Overlay control; filled accent when locked |
| Favorite | Catalog preference (future) | Bookmark-style control; accent when on |

## Missing images

Always use `EmptyPhoto`. Do not leave blank gray boxes or broken `img` tags. Image upload / `imageUrl` is optional future work.

## Future features

New routes (recipes catalog, import, shopping, login) must import `AppHeader`, brand buttons, and `RecipeCard` / form styles from `app/components/brand/`. Match tokens in `DESIGN_TOKENS.md`.
