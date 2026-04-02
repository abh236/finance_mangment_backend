# Workspace map (backend1)

Use this file as the **navigation index** for all projects and docs in this folder.

## Recommended order (do this first)

| Priority | Task | Why |
|----------|------|-----|
| 1 | Run **`finance-dashboard-platform`** for the full assignment (SQL, RBAC, Swagger, migrations) | Best match for “finance dashboard + roles + analytics + DB” |
| 2 | Use **root** `src/` + `data/db.json` only if you need a **zero-install DB** demo | Lightweight; no Knex/Postgres |
| 3 | Keep **two `.env` files** (root + platform) — they are **separate apps** | Same `PORT` in both will conflict if both run at once |

## Folder → purpose → entry points

| Path | What it is | Start command | Docs |
|------|------------|---------------|------|
| [README.md](../README.md) | Workspace overview | — | You are here (parent) |
| [finance-dashboard-platform/README.md](../finance-dashboard-platform/README.md) | Main API (Knex, SQLite/PG) | From repo root: `npm run dev:platform` | Env, Docker, endpoints |
| [finance-dashboard-platform/src/server.js](../finance-dashboard-platform/src/server.js) | Platform HTTP bootstrap | — | Loads `app.js`, runs migrations |
| [finance-dashboard-platform/src/app.js](../finance-dashboard-platform/src/app.js) | Platform Express app | — | Routes, Swagger `/api/docs` |
| [src/server.js](../src/server.js) | Lite API bootstrap | `npm run dev` | Port from `.env` |
| [src/app.js](../src/app.js) | Lite Express app | — | JSON `data/db.json` |
| [data/db.json](../data/db.json) | Lite persistence | — | Not linked to platform DB |

## Scripts from repository root

Defined in root [package.json](../package.json):

- `npm run dev` — lite JSON API (`nodemon src/server.js`)
- `npm run start` — lite API (`node src/server.js`)
- `npm run dev:platform` — Knex platform with nodemon
- `npm run start:platform` — Knex platform
- `npm run install:platform` — install only platform dependencies
- `npm run install:all` — install root + platform dependencies
- `npm run migrate:platform` — run Knex migrations (platform)
- `npm run seed:platform` — run Knex seeds (platform)

## What is *not* unified (by design)

- **No shared database** between root and `finance-dashboard-platform`.
- **No single merged codebase** — two deployable apps; choose one for production.

## Optional / not in this repo

- **`Zorvyn-backend-task-main`**: patterns (Swagger, middleware style) were **absorbed into** `finance-dashboard-platform`; that repo is not required inside `backend1` unless you copy it in for reference.

## Remaining optional tasks (not required for the assignment)

| Task | Status |
|------|--------|
| Merge lite + platform into **one** codebase | **Not done** — two apps stay separate on purpose |
| Shared `.env` / one database for both apps | **Not done** — avoids accidental coupling |
| Automated E2E or unit tests | **Not done** — add Jest/Supertest if needed |
| CI (e.g. GitHub Actions) | **Not done** |

## Done in this workspace pass

- **Linked docs:** [README.md](../README.md) ↔ [WORKSPACE.md](WORKSPACE.md) ↔ [finance-dashboard-platform/README.md](../finance-dashboard-platform/README.md)
- **Root npm scripts:** `dev:platform`, `start:platform`, `install:platform`, `install:all`, `migrate:platform`, `seed:platform`
- **Removed** empty stray folder `finance-dropdown-platform` (leftover)
