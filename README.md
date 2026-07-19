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

- `/` — this week’s plan, lock meals, regenerate, grocery list
- `/settings` — dinners per week, max cook time, no-repeat window, servings
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

## Roadmap (next)

1. Postgres repository adapter for hosted multi-device sync
2. In-app recipe catalog
3. Weekly effort/novelty sliders
4. TikTok import with review
5. Shopping handoff / Instacart-ready export
