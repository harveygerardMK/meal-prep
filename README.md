# Weekly Meal Prep

A private, single-household weekly meal planner: dinners, kid lunches, and a grocery list.

**Live:** [https://meals.wheresharvey.com](https://meals.wheresharvey.com)

## Deployment model

**Target: Cloudflare Workers + D1** for the household phones, with a JSON file fallback for local development and tests.

| Mode | When | Storage | Auth |
|------|------|---------|------|
| Local open | `HOUSEHOLD_PASSWORD` unset | Atomic JSON under `data/` | Off |
| Local gated | `HOUSEHOLD_PASSWORD` + `AUTH_SECRET` set | Atomic JSON (or local D1 via `npm run preview`) | Shared household login at `/login` |
| Production | Cloudflare Worker secrets | Cloudflare D1 (`MEALS_DB` documents table) | Shared household login |

JSON writes on disk use temp-file rename + per-file serialization (safe for a single Node process). On Cloudflare, the same repository API is backed by D1 whole-document rows.

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
| `npm run dev` | Development server (Node) |
| `npm run build` | Next.js production build |
| `npm run start` | Run production server (Node) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run preview` | Build + run in local Cloudflare `workerd` |
| `npm run deploy` | Build + deploy Worker to Cloudflare |
| `npm run db:migrate:local` / `db:migrate:remote` | Apply D1 migrations |
| `npm run db:seed:local` / `db:seed:remote` | Seed D1 from `data/*.json` |

## Cloudflare deploy

### Manual (local Wrangler)

```bash
# one-time (already done for this project)
npx wrangler d1 create meal-prep-db
npm run db:migrate:remote
npm run db:seed:remote
printf '%s' "$AUTH_SECRET" | npx wrangler secret put AUTH_SECRET
printf '%s' "$HOUSEHOLD_PASSWORD" | npx wrangler secret put HOUSEHOLD_PASSWORD

npm run deploy
```

Custom domain is configured in [`wrangler.jsonc`](wrangler.jsonc) as `meals.wheresharvey.com`.

### Workers Builds (auto-deploy on push to `main`)

Pushing to GitHub does **not** go live until [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) is connected. One-time setup:

1. Open the Worker’s Builds settings: [meal-prep → Settings → Builds](https://dash.cloudflare.com/2943a10794704030ed749b21d6d39ee8/workers/services/view/meal-prep/production/settings)
2. Select **Connect**, authorize the **Cloudflare GitHub App** if prompted, and choose repo `harveygerardMK/meal-prep`
3. Use these build settings:

| Setting | Value |
|---------|--------|
| Production branch | `main` |
| Build command | _(leave empty)_ |
| Deploy command | `npm run deploy` |
| Non-production deploy command | `npm run upload` |
| Root directory | `/` |

4. Save, then push any commit to `main` (or use **Retry build** / trigger from the dashboard) to verify.

`npm run deploy` already runs the OpenNext Cloudflare build (including the `proxy.ts` ↔ `middleware.ts` swap) and then deploys. Deployments use `--keep-vars` so existing Worker secrets are not wiped.

Runtime secrets (`AUTH_SECRET`, `HOUSEHOLD_PASSWORD`, …) stay in **Settings → Variables and Secrets**. Build-time vars (if you add any `NEXT_PUBLIC_*`) go under **Build variables and secrets**.

## Architecture notes

- Repositories live under [`lib/repositories/`](lib/repositories/) and own persistence.
- [`getDocumentStore()`](lib/repositories/getDocumentStore.ts) prefers D1 when the Cloudflare binding is present, otherwise uses `data/*.json`.
- `GET /api/plan` is **read-only**. Creating a missing week requires `POST /api/plan` with `{ "action": "ensure" }`.
- Regenerating uses `POST /api/plan` with `{ "action": "regenerate", "locks": … }`.
- Cloudflare builds temporarily swap Next.js 16 `proxy.ts` for edge `middleware.ts` (see [`scripts/cloudflare-build.mjs`](scripts/cloudflare-build.mjs)).

## Data files

| File | Role |
|------|------|
| `data/recipes.json` | Dinner and lunch catalog |
| `data/settings.json` | Planning constraints |
| `data/history.json` | Past and current week plans |
| `data/imports.json` | TikTok import drafts |
| `data/plan-queue.json` | Next-week queue |

On Cloudflare these become rows in the D1 `documents` table.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vitest, `jose` sessions, `@opennextjs/cloudflare`, Cloudflare D1.

## Roadmap status

Shipped on `feature/roadmap-foundation`:

1. Private foundation (repositories, auth gate, read-only plan GET)
2. Recipe catalog
3. Weekly effort/novelty sliders
4. TikTok import with review + next-week queue
5. Shopping export / Instacart search-link handoff (landing API flagged off until access exists)
6. Cloudflare Workers + D1 hosting at `meals.wheresharvey.com`
