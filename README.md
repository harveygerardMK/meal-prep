# Weekly Meal Prep

A private, single-household weekly meal planner: dinners, kid lunches, and a grocery list.

## Deployment model

**Chosen model: local / single-household self-hosted.**

- Plans, settings, and history are stored as JSON files under [`data/`](data/).
- Run with `npm run dev` or `npm run build && npm run start` on a machine with a durable writable disk.
- Do **not** deploy to Vercel (or other serverless hosts) without replacing the filesystem store — writes to `data/` do not persist there.
- There is no authentication; treat this as a local/private tool on a trusted network.

Hosted multi-device use would require durable storage and auth first. That is out of scope while this local model is in effect.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — this week’s plan, lock meals, regenerate, grocery list
- `/settings` — dinners per week, max cook time, no-repeat window, servings

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

## Data files

| File | Role |
|------|------|
| `data/recipes.json` | Dinner and lunch catalog (edit by hand) |
| `data/settings.json` | Planning constraints |
| `data/history.json` | Past and current week plans |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.

## Workflow priorities (current)

Shipped for daily use with the local model:

- Persistent grocery checkoffs (this device, per week)
- Clear load/save/regenerate error and success feedback
- Request validation and unit tests for planning helpers

Still later (not blocking local use): quantity scaling, in-app recipe editing, protein/tag filters.
