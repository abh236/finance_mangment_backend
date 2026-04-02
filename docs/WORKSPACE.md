# Workspace map (backend1)

Use this file as a **navigation index**. **Full documentation is only in the root [README.md](../README.md)** (no duplicate long README in subfolders).

## Recommended order (do this first)

| Priority | Task | Why |
|----------|------|-----|
| 1 | Run **`finance-dashboard-platform`** for the full assignment (MongoDB, RBAC, Swagger, analytics) | Best match for “finance dashboard + roles + analytics + DB” |
| 2 | Use **root** `src/` + `data/db.json` only if you need a **zero MongoDB** demo | Lightweight JSON store |
| 3 | Use **two env files**: `.env` at root (lite) and **`finance-dashboard-platform/.env`** (platform) | Same `PORT` in both will conflict if both run at once |

## Config files (no duplicates)

| File | Purpose |
|------|---------|
| [`.gitignore`](../.gitignore) | **One** file for the whole repo (root + platform) |
| [`.env.example`](../.env.example) | Template for **lite** API → copy to **`.env`** at root |
| [`env.platform.example`](../env.platform.example) | Template for **platform** → copy to **`finance-dashboard-platform/.env`** (includes `MONGODB_URI`) |

## Folder → purpose → entry points

| Path | What it is | Start command | Docs |
|------|------------|---------------|------|
| [README.md](../README.md) | **Complete guide** | — | Single source of truth |
| [finance-dashboard-platform/README.md](../finance-dashboard-platform/README.md) | Short pointer only | — | Links to parent README |
| [finance-dashboard-platform/src/server.js](../finance-dashboard-platform/src/server.js) | Platform HTTP bootstrap | — | Connects MongoDB, then listens |
| [finance-dashboard-platform/src/app.js](../finance-dashboard-platform/src/app.js) | Platform Express app | — | Routes, Swagger `/api/docs` |
| [src/server.js](../src/server.js) | Lite API bootstrap | `npm run dev` | Port from root `.env` |
| [src/app.js](../src/app.js) | Lite Express app | — | JSON `data/db.json` |
| [data/db.json](../data/db.json) | Lite persistence | — | Not linked to platform DB |

## Scripts from repository root

Defined in root [package.json](../package.json):

- `npm run dev` — lite JSON API (`nodemon src/server.js`)
- `npm run start` — lite API (`node src/server.js`)
- `npm run dev:platform` — platform with nodemon (MongoDB)
- `npm run start:platform` — platform (`node`)
- `npm run install:platform` — install only platform dependencies
- `npm run install:all` — install root + platform dependencies
- `npm run seed:platform` — seed default admin user in MongoDB (platform)

## What is *not* unified (by design)

- **No shared database** between root and `finance-dashboard-platform`.
- **No single merged codebase** — two deployable apps; choose one for production.

## Remaining optional tasks (not required for the assignment)

| Task | Status |
|------|--------|
| Merge lite + platform into **one** codebase | **Not done** — two apps stay separate on purpose |
| Shared `.env` / one database for both apps | **Not done** — avoids accidental coupling |
| Automated E2E or unit tests | **Not done** — add Jest/Supertest if needed |
| CI (e.g. GitHub Actions) | **Not done** |

## Done in this workspace pass

- **Single `.gitignore`** at repo root; removed duplicate in `finance-dashboard-platform/`
- **Single long README** at root; platform `README.md` is a short pointer only
- **Platform env template** at root as `env.platform.example` (MongoDB `MONGODB_URI`)
