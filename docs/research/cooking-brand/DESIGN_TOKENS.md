# Design Tokens — Editorial Cooking Brand

Reference: [cooking.nytimes.com](https://cooking.nytimes.com/) homepage (surveyed Jul 2026).  
These are **adapted house tokens**, not a pixel-perfect extract of NYT’s proprietary system. No NYT logos, typefaces, or assets.

## Color

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#FFFFFF` | Page canvas |
| `--foreground` | `#121212` | Primary text |
| `--muted` | `#6B6B6B` | Secondary / helper text |
| `--meta` | `#757575` | Cook time, protein, tags |
| `--border` | `#E5E5E5` | Hairline rules, input borders |
| `--card` | `#FFFFFF` | Card surfaces |
| `--accent` | `#E33D26` | Primary CTA, eyebrows, focus |
| `--accent-hover` | `#C73420` | Accent hover |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--accent-soft` | `#FDF0EE` | Soft accent wash / EmptyPhoto tint |
| `--photo-wash-1` | `#F3EDE6` | EmptyPhoto palette A |
| `--photo-wash-2` | `#E8EFEA` | EmptyPhoto palette B |
| `--photo-wash-3` | `#EDE8F0` | EmptyPhoto palette C |
| `--locked` | `#E33D26` | Locked state (uses accent) |
| `--success` | `#2F6F4E` | Save confirmations |

Light editorial is the default. No auto dark mode — the brand is a white canvas.

## Typography

| Role | Family | Weight | Size / line | Notes |
|------|--------|--------|-------------|-------|
| Display / page title | Source Serif 4 | 600–700 | 32–40px / 1.15 | Serif hero titles |
| Recipe / meal name | Source Serif 4 | 600 | 20–24px / 1.25 | Card titles |
| Section label | Source Sans 3 | 700 | 12–13px / 1.2 | Uppercase, letter-spacing ~0.06em |
| Eyebrow | Source Sans 3 | 700 | 11–12px / 1.2 | Uppercase, accent color |
| Body / UI | Source Sans 3 | 400–600 | 14–16px / 1.5 | Nav, buttons, forms |
| Meta | Source Sans 3 | 400 | 13–14px / 1.4 | Time · protein · tags |

Google Font substitutes (not NYT Cheltenham / proprietary faces).

## Spacing

| Token | Value | Use |
|-------|-------|-----|
| Page gutter | `24px` (`px-6`) | Mobile/desktop side padding |
| Content max | `1120px` (`max-w-5xl` / `max-w-6xl`) | Plan / catalog width |
| Section gap | `40–48px` | Between major sections |
| Card gap | `16–24px` | Grid gap |
| Card body pad | `16px` below image | Title + meta block |

## Radii & borders

| Element | Radius | Border |
|---------|--------|--------|
| Primary button | `4px` (slightly soft rect) | none |
| Secondary button | `4px` | `1px solid var(--border)` |
| Inputs | `4px` | `1px solid var(--border)` |
| Recipe card | `0` image / card (editorial, no heavy rounded cards) | none under image; optional bottom rule |
| Search-like controls | `9999px` only if search-shaped | optional |

Prefer **no card chrome** (no zinc bordered rounded-xl boxes). Structure comes from photography, type, and hairline rules.

## Motion

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button hover | 150ms | ease |
| Lock / favorite toggle | 150ms | ease |
| Photo hover scale (optional) | 200ms | ease-out | `scale(1.02)` on image only |
