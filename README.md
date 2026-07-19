# Weekly Meal Prep

A private, single-household weekly meal planner: dinners, kid lunches, and a grocery list.

## Deployment model

**Target: private hosted app for household phones**, with a JSON repository adapter for local development.

| Mode | When | Storage | Auth |
|------|------|---------|------|
| Local open | `HOUSEHOLD_PASSWORD` unset | Atomic JSON under `data/` | Off |
| Private gated | `HOUSEHOLD_PASSWORD` + `AUTH_SECRET` set | Atomic JSON (or future Postgres) | Shared household login at `/login` |

JSON writes use temp-file rename + per-file serialization. That is safe for a **single Node server with durable disk**. It is still **not** durable on serverless ephemeral filesystems — for Vercel multi-device, set a Postgres `DATABASE_URL` (adapter planned next) or run a persistent Node host.

Do not deploy publicly without setting `HOUSEHOLD_PASSWORD`.

## Getting started

```bash
npm install
cp .env.example .env.local
# optional: set HOUSEHOLD_PASSWORD and AUTH_SECRET (32+ chars)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — this week’s plan, lock meals, regenerate, grocery list, weekly sliders
- `/recipes` — curated catalog (add/edit/favorite/archive)
- `/import` — TikTok link + caption/notes → review draft → queue next week
- `/shopping` — copyable grocery export + Instacart search links
- `/settings` — dinners per week, cook effort/novelty defaults, servings
- `/login` — household password (only when auth env vars are set)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

## Architecture notes

- Repositories live under [`lib/repositories/`](lib/repositories/) and own persistence.
- `GET /api/plan` is **read-only**. Creating a missing week requires `POST /api/plan` with `{ "action": "ensure" }`.
- Regenerating uses `POST /api/plan` with `{ "action": "regenerate", "locks": … }`.

## Data files

| File | Role |
|------|------|
| `data/recipes.json` | Dinner and lunch catalog (edit by hand for now) |
| `data/settings.json` | Planning constraints |
| `data/history.json` | Past and current week plans |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vitest, `jose` sessions.

## Roadmap status

Shipped on `feature/roadmap-foundation`:

1. Private foundation (repositories, auth gate, read-only plan GET)
2. Recipe catalog
3. Weekly effort/novelty sliders
4. TikTok import with review + next-week queue
5. Shopping export / Instacart search-link handoff (landing API flagged off until access exists)

Still next: Postgres adapter for true multi-device serverless hosting.
