# Finance Dashboard Backend — Complete Guide

This repository implements a **Node.js + Express** backend for a **finance dashboard** where users with different **roles** access **financial records** and **summary analytics**. Everything below is written so you can **install from zero**, **understand each requirement**, and **run and test** the system step by step.

---

## Table of contents

1. [What is in this folder (two apps)](#1-what-is-in-this-folder-two-apps)
2. [Which app to use for the assignment](#2-which-app-to-use-for-the-assignment)
3. [Assignment requirements — how each is met](#3-assignment-requirements--how-each-is-met)
4. [Prerequisites](#4-prerequisites)
5. [Step-by-step setup (recommended path)](#5-step-by-step-setup-recommended-path)
6. [Step-by-step setup (PostgreSQL + Docker)](#6-step-by-step-setup-postgresql--docker)
7. [Step-by-step setup (lite JSON API — optional)](#7-step-by-step-setup-lite-json-api--optional)
8. [Environment variables (explained)](#8-environment-variables-explained)
9. [NPM scripts (from repository root)](#9-npm-scripts-from-repository-root)
10. [Authentication flow (every step)](#10-authentication-flow-every-step)
11. [API reference (endpoints and roles)](#11-api-reference-endpoints-and-roles)
12. [Example requests (copy/paste)](#12-example-requests-copypaste)
13. [Financial record fields and rules](#13-financial-record-fields-and-rules)
14. [Dashboard analytics (what each endpoint returns)](#14-dashboard-analytics-what-each-endpoint-returns)
15. [Validation, errors, and HTTP status codes](#15-validation-errors-and-http-status-codes)
16. [Data persistence (where data lives)](#16-data-persistence-where-data-lives)
17. [Optional features included](#17-optional-features-included)
18. [How this maps to typical evaluation criteria](#18-how-this-maps-to-typical-evaluation-criteria)
19. [Project structure (files and folders)](#19-project-structure-files-and-folders)
20. [Troubleshooting](#20-troubleshooting)
21. [Further reading](#21-further-reading)

---

## 1. What is in this folder (two apps)

| Location | Name | Purpose |
|----------|------|---------|
| Repository **root** (`src/`, `data/db.json`) | **Lite API** | Smaller demo: **JSON file** storage, **Zod** validation, **JWT**. Good for quick tests **without** a SQL database. |
| **`finance-dashboard-platform/`** | **Platform API** | **Main** submission-style app: **Knex**, **SQLite or PostgreSQL**, **migrations**, **indexes**, **Swagger UI**, **rate limits**, **soft deletes**, **SQL aggregates** for the dashboard. |

**Important:** The two apps are **not linked**. They do **not** share one database. You choose one to run (or run the other on a **different `PORT`**).

---

## 2. Which app to use for the assignment

For requirements that mention **relational persistence**, **migrations**, **scalability**, and **clear API documentation**, use:

**`finance-dashboard-platform`**

The lite root app still satisfies **Node + Express** and **RBAC/CRUD** at a simpler level, but the **platform** matches the brief more completely (SQL, structured docs, operational middleware).

---

## 3. Assignment requirements — how each is met

Below is the **original requirement theme** mapped to **what exists in this repo** and **where to look in code**.

### 1) User and role management

| Requirement | Platform (`finance-dashboard-platform`) | Lite (root) |
|-------------|------------------------------------------|-------------|
| Create/manage users | `POST /api/auth/register` (public); `GET /api/users`, `PATCH /api/users/:id` (**admin**) — routes in `src/routes/users.js`, `auth.js` | `register` in `src/routes/authRoutes.js`; users in `src/routes/userRoutes.js` |
| Assign roles | Body includes `role`: `viewer`, `analyst`, `admin` | Same enum via Zod in `src/validators/authValidators.js` |
| Active / inactive | `status`: `active` \| `inactive` on users (platform); login rejects inactive | `isActive` boolean; auth reloads user from `data/db.json` |
| Restrict by role | Middleware `requireRoles` / route-level rules in `src/routes/*.js` | `authorize` middleware + `src/config/roles.js` permissions |

**Roles (platform — recommended behavior):**

- **viewer:** dashboard **only** (totals, trends, activity) — **cannot** list raw `/api/records`.
- **analyst:** dashboard + **read** financial records (`GET /api/records`).
- **admin:** **full** record CRUD (create/update/**soft delete**) + **user management**.

**Roles (lite):** Same names; viewer is **dashboard-only** in permission config (`src/config/roles.js`).

---

### 2) Financial records management

| Requirement | Platform | Lite |
|-------------|----------|------|
| Fields: amount, type, category, date, notes | Yes — see migration `src/db/migrations/` and validators | Yes — Zod in `src/validators/recordValidators.js` |
| Create | `POST /api/records` (**admin**) | `POST /api/records` (permission `records:create`) |
| Read / list / filter | `GET /api/records` (**analyst, admin**) — filter `type`, `category`, dates, search `q`, pagination | `GET /api/records` with filters |
| Update | `PATCH /api/records/:id` (**admin**) | `PATCH` with permission |
| Delete | `DELETE` — **soft delete** (`deleted_at`) | Hard delete in JSON store (implementation choice) |

---

### 3) Dashboard summary APIs

| Requirement | Platform | Lite |
|-------------|----------|------|
| Total income / expenses / net | `GET /api/dashboard/summary` — SQL `SUM`/`CASE` in `finance-dashboard-platform/src/services/dashboardService.js` | `GET /api/dashboard/summary` — in-memory aggregates over JSON in `src/services/dashboardService.js` |
| Category totals | `GET /api/dashboard/categories` | **Not exposed** as a separate route (only `summary` exists in `src/routes/dashboardRoutes.js`) |
| Recent activity | `GET /api/dashboard/activity` | **Not in lite** |
| Monthly / weekly trends | `GET /api/dashboard/trends/monthly`, `trends/weekly` (dialect-aware for SQLite vs PostgreSQL) | **Not in lite** |

Aggregates are computed **in the database** on the platform side, which is what reviewers usually want for “not just CRUD.” For the **full** dashboard requirement set, **use the platform**.

---

### 4) Access control logic

| Mechanism | Platform | Lite |
|-----------|----------|------|
| Technique | JWT + `authenticate` + `requireRoles(...)` on routes | JWT + `authenticate` + `authorize([permissions])` |
| Enforcement | **Route level** (cannot bypass without changing code) | Same idea |

---

### 5) Validation and error handling

| Topic | Platform | Lite |
|-------|----------|------|
| Input validation | `express-validator` on routes; `422` + `details` | **Zod** in `src/middleware/validate.js` + schemas in `src/validators/` |
| Consistent errors | `success: false`, `error`, optional `details` | `message` / `HttpError` in `src/utils/httpError.js` |
| Status codes | 400/401/403/404/409/422/429/500 used appropriately | Similar |

---

### 6) Data persistence

| Approach | Platform | Lite |
|----------|----------|------|
| Default | **SQLite** file: `finance-dashboard-platform/data/finance.db` | **JSON:** `data/db.json` |
| Alternative | **PostgreSQL** via `DATABASE_URL` + `DB_CLIENT=pg` | N/A (file only) |

If you use **only** the JSON file approach, say so in documentation — **this README does**.

---

## 4. Prerequisites

1. **Node.js** version **18 or newer** (LTS recommended).  
   Check: `node -v`
2. **npm** (comes with Node).  
   Check: `npm -v`
3. **Git** (optional, for version control).
4. **Docker Desktop** (optional) — only if you use **PostgreSQL** via `docker compose`.

---

## 5. Step-by-step setup (recommended path)

These steps run the **platform** API with **SQLite** (no Docker).

### Step 1 — Open a terminal in the repository

```text
cd path\to\backend1
```

(On macOS/Linux, use the equivalent path.)

### Step 2 — Install dependencies (root + platform)

From **`backend1`** (repository root):

```bash
npm run install:all
```

What this does:

- Runs `npm install` in the root (needed if you use the **lite** app).
- Runs `npm install` inside **`finance-dashboard-platform`**.

### Step 3 — Create the platform environment file

**Windows (PowerShell):**

```powershell
Copy-Item .\finance-dashboard-platform\.env.example .\finance-dashboard-platform\.env
```

**macOS / Linux:**

```bash
cp finance-dashboard-platform/.env.example finance-dashboard-platform/.env
```

### Step 4 — Edit `.env` (minimum)

Open `finance-dashboard-platform/.env` and set at least:

```env
PORT=4000
JWT_SECRET=your-long-random-secret-here
```

- **`JWT_SECRET`**: must be **strong** in any shared or production-like environment.  
- **`PORT`**: change if `4000` is already used (e.g. `4001`).

### Step 5 — Start the platform server

From repository **root**:

```bash
npm run dev:platform
```

Or from inside `finance-dashboard-platform`:

```bash
cd finance-dashboard-platform
npm run dev
```

### Step 6 — Confirm the server is running

You should see log lines similar to:

- `Finance Dashboard Platform listening on http://localhost:4000`
- `Swagger UI: http://localhost:4000/api/docs`

### Step 7 — Open in browser

| URL | Expected |
|-----|----------|
| `http://localhost:4000/` | Short HTML page with links |
| `http://localhost:4000/health` | JSON like `{"ok":true,"service":"finance-dashboard-platform"}` |
| `http://localhost:4000/api/docs` | **Swagger UI** |

### Step 8 — Run database migrations (usually automatic)

On startup, the platform runs **Knex** `migrate:latest` unless you set **`SKIP_DB_MIGRATE=true`**.

To run migrations **manually** from repo root:

```bash
npm run migrate:platform
```

### Step 9 — (Optional) Seed admin user

From repo root:

```bash
npm run seed:platform
```

Default seed (change in production):

- Email: `admin@example.com`  
- Password: `admin123`

---

## 6. Step-by-step setup (PostgreSQL + Docker)

Use this when you want **PostgreSQL** (closer to production, better concurrency than a single JSON file).

### Step 1 — Start PostgreSQL

From **`finance-dashboard-platform`** (where `docker-compose.yml` lives):

```bash
cd finance-dashboard-platform
docker compose up -d
```

### Step 2 — Configure `.env`

In `finance-dashboard-platform/.env`:

```env
DB_CLIENT=pg
DATABASE_URL=postgresql://finance:finance@localhost:5432/finance_dashboard
JWT_SECRET=your-long-random-secret-here
PORT=4000
```

Match **user/password/database** to `docker-compose.yml` if you change them.

### Step 3 — Start the API

From repo root:

```bash
npm run dev:platform
```

Migrations create tables and indexes on first boot (or run `npm run migrate:platform`).

### Step 4 — Verify

Same as SQLite: `/health`, `/api/docs`, then register/login (see [§12](#12-example-requests-copypaste)).

---

## 7. Step-by-step setup (lite JSON API — optional)

### Step 1 — Install root dependencies only

```bash
cd backend1
npm install
```

### Step 2 — Environment

```powershell
Copy-Item .env.example .env
```

Set `JWT_SECRET` and optionally `PORT` in `.env`.

### Step 3 — Run

```bash
npm run dev
```

### Step 4 — Data

User and record data is stored in **`data/db.json`**. Back up this file if you care about the data.

**Do not** expect this file to sync with the platform database.

---

## 8. Environment variables (explained)

### Platform (`finance-dashboard-platform/.env`)

| Variable | Required | Meaning |
|----------|----------|---------|
| `PORT` | No | HTTP port (default `4000`). |
| `NODE_ENV` | No | `development` or `production` — affects logging and Knex environment. |
| `JWT_SECRET` | **Yes for real use** | Secret key to sign JWTs. Weak or missing secrets are a security risk. |
| `JWT_EXPIRES_IN` | No | Token lifetime (e.g. `7d`, `12h`). |
| `DB_CLIENT` | No | `sqlite3` (default) or `pg`. |
| `DATABASE_URL` | Yes if `DB_CLIENT=pg` | PostgreSQL connection string. |
| `PG_SSL` | No | `true` when provider requires SSL. |
| `SKIP_DB_MIGRATE` | No | If `true`, migrations do **not** run on server start. |

### Lite (root `.env`)

| Variable | Meaning |
|----------|---------|
| `PORT` | Server port. |
| `JWT_SECRET` | JWT signing secret. |

---

## 9. NPM scripts (from repository root)

| Command | What it does |
|---------|----------------|
| `npm run install:all` | Installs root + platform dependencies. |
| `npm run install:platform` | Installs only platform dependencies. |
| `npm run dev:platform` | Platform dev server (nodemon). |
| `npm run start:platform` | Platform production-style (`node`). |
| `npm run migrate:platform` | Run Knex migrations for platform. |
| `npm run seed:platform` | Run Knex seeds (e.g. admin). |
| `npm run dev` | Lite API (nodemon). |
| `npm start` | Lite API (`node`). |

Inside **`finance-dashboard-platform`**, `npm run dev`, `npm start`, `npm run migrate`, `npm run seed` work the same as in that project’s `package.json`.

---

## 10. Authentication flow (every step)

### Registration

1. Client sends `POST /api/auth/register` with JSON body (`name`, `email`, `password`, optional `role`).  
2. Server validates input.  
3. Password is **hashed** (bcrypt).  
4. User row is stored.  
5. Response returns **no password** (platform returns `success: true` and user profile; lite returns similar).

### Login

1. Client sends `POST /api/auth/login` with `email`, `password`.  
2. Server looks up user; compares password with bcrypt.  
3. If **inactive** (platform: `status`; lite: `isActive`), login is **rejected** (`403`).  
4. Server issues **JWT** signed with `JWT_SECRET`.  
5. Client stores token and sends `Authorization: Bearer <token>` on later requests.

### Authenticated request

1. Middleware reads `Authorization` header.  
2. JWT is verified.  
3. **Platform:** user is loaded from DB; **lite:** user is loaded from `db.json` (ensures still active / exists).  
4. `req.user` (or equivalent) is attached; route checks **role**/**permissions**.

---

## 11. API reference (endpoints and roles)

Base path: **`/api`** (both apps).

### Auth (public unless noted)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | Yes | Current user (**platform only**; lite has no `/me` route) |

### Users (**admin** only, platform)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List users (pagination) |
| GET | `/api/users/:id` | Get one user |
| PATCH | `/api/users/:id` | Update name, role, status |

### Records (platform)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/records` | **analyst, admin** | List + filters + `q` + pagination |
| GET | `/api/records/:id` | **analyst, admin** | One record |
| POST | `/api/records` | **admin** | Create |
| PATCH | `/api/records/:id` | **admin** | Update |
| DELETE | `/api/records/:id` | **admin** | Soft delete |

### Dashboard (platform)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/dashboard/summary` | **viewer, analyst, admin** | Totals and net |
| GET | `/api/dashboard/categories` | viewer+ | By category |
| GET | `/api/dashboard/trends/monthly` | viewer+ | Monthly trend |
| GET | `/api/dashboard/trends/weekly` | viewer+ | Weekly trend |
| GET | `/api/dashboard/activity` | viewer+ | Recent rows |

*(Lite app may expose fewer paths; open `src/routes/` for the exact list.)*

---

## 12. Example requests (copy/paste)

Replace `HOST` with `http://localhost:4000` (or your `PORT`).

### Register (analyst example)

```http
POST HOST/api/auth/register
Content-Type: application/json

{
  "name": "Ada Analyst",
  "email": "ada@example.com",
  "password": "password123",
  "role": "analyst"
}
```

### Login

```http
POST HOST/api/auth/login
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "password123"
}
```

Save `token` from the response.

### Dashboard summary (viewer or above)

```http
GET HOST/api/dashboard/summary
Authorization: Bearer YOUR_TOKEN_HERE
```

### List records (analyst or admin)

```http
GET HOST/api/records?page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

### Create record (admin only)

```http
POST HOST/api/records
Authorization: Bearer ADMIN_TOKEN_HERE
Content-Type: application/json

{
  "amount": 1500.50,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01T10:00:00.000Z",
  "notes": "Monthly pay"
}
```

*(Use an admin token; analyst receives `403` on this route on the platform.)*

---

## 13. Financial record fields and rules

| Field | Type / values | Notes |
|-------|----------------|-------|
| `amount` | Positive number | Expense amounts are still **positive** in storage; **type** distinguishes income vs expense. |
| `type` | `income` \| `expense` | Required |
| `category` | String | Required |
| `date` | ISO 8601 datetime string | Required on create |
| `notes` | String, optional | |

**Platform:** deleted records have `deleted_at` set and are **excluded** from normal list/dashboard queries.

---

## 14. Dashboard analytics (what each endpoint returns)

| Endpoint | Purpose |
|----------|---------|
| `/summary` | Total income, total expenses, net balance, record count — **one aggregate query**. |
| `/categories` | Breakdown by **category** and **type** with sums. |
| `/trends/monthly` | Buckets by **month**; income, expenses, net per bucket. |
| `/trends/weekly` | Buckets by **week**; income and expenses. |
| `/activity` | Latest N entries (for “recent activity” on a UI). |

This demonstrates **aggregated** API design, not only CRUD.

---

## 15. Validation, errors, and HTTP status codes

| Code | Typical cause |
|------|----------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / business rule |
| 401 | Missing or invalid JWT |
| 403 | Wrong role or inactive account |
| 404 | Unknown route or entity |
| 409 | Conflict (e.g. email already registered) |
| 422 | Validation failed (platform: express-validator) |
| 429 | Rate limit exceeded (platform: auth/global limiters) |
| 500 | Unexpected server error |

---

## 16. Data persistence (where data lives)

| App | Storage | Location |
|-----|---------|----------|
| Platform + SQLite | File DB | `finance-dashboard-platform/data/finance.db` |
| Platform + PostgreSQL | Server DB | Configured by `DATABASE_URL` |
| Lite | JSON | `data/db.json` |

**Tradeoff stated clearly:** the **lite** app uses a **simplified JSON file** database suitable for demos; the **platform** uses **real SQL** with migrations and indexes.

---

## 17. Optional features included

| Enhancement | Platform | Lite |
|-------------|----------|------|
| JWT authentication | Yes | Yes |
| Pagination | Yes (`page`, `limit`) | Yes |
| Search | `q` on records (category/notes) | Varies |
| Soft delete | Yes | No (JSON store) |
| Rate limiting | Yes (`/auth` + API) | No |
| API docs | **Swagger UI** `/api/docs` | No |

**Not included by default:** refresh tokens, full test suite, CI — add if your rubric requires them.

---

## 18. How this maps to typical evaluation criteria

| Criterion | How the repo addresses it |
|-----------|----------------------------|
| Backend design | Separate **routes → controllers → services/models**; config and middleware isolated. |
| Logical thinking | RBAC explicit per route; aggregates in SQL; soft delete for history. |
| Functionality | Auth, users, CRUD, filters, dashboard endpoints (platform). |
| Code quality | Consistent naming, small modules, README + workspace docs. |
| Database modeling | Normalized **users** + **financial_records**, FKs, indexes (platform). |
| Validation / reliability | Validators + error middleware; meaningful status codes. |
| Documentation | **This README** + [docs/WORKSPACE.md](docs/WORKSPACE.md) + platform README. |
| Extra thoughtfulness | Swagger, rate limits, helmet, compression, dual DB option. |

---

## 19. Project structure (files and folders)

```text
backend1/
├── README.md                 ← This file (master guide)
├── docs/
│   └── WORKSPACE.md          ← Quick map + script index
├── package.json              ← Root scripts (dev:platform, install:all, …)
├── .env.example
├── data/
│   └── db.json               ← Lite API storage only
├── src/                      ← Lite Express app
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── utils/
└── finance-dashboard-platform/
    ├── README.md             ← Platform-specific technical reference
    ├── package.json
    ├── knexfile.js
    ├── docker-compose.yml
    ├── .env.example
    ├── data/                 ← SQLite file (when DB_CLIENT=sqlite3)
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        ├── db/migrations/
        ├── db/seeds/
        ├── docs/openapi.spec.js
        ├── middleware/
        ├── routes/
        ├── controllers/
        ├── services/
        └── models/
```

*(Paths match the repo; `knexfile.js` and `docker-compose.yml` live in `finance-dashboard-platform/`.)*

---

## 20. Troubleshooting

| Problem | What to try |
|---------|-------------|
| Port already in use | Change `PORT` in `.env` or stop the other process. |
| Cannot run both apps | They default to the same port — use **two ports**. |
| `npm install` errors on OneDrive | Copy project to a non-synced folder (e.g. `C:\dev`) and retry. |
| JWT / 401 errors | Set `JWT_SECRET`, restart server, login again. |
| Postgres connection failed | Check Docker is up, `DATABASE_URL`, firewall. |
| Migrations error | Check `SKIP_DB_MIGRATE`; run `npm run migrate:platform` once manually. |

---

## 21. Further reading

- **[docs/WORKSPACE.md](docs/WORKSPACE.md)** — Short linked index and “what to run first.”
- **[finance-dashboard-platform/README.md](finance-dashboard-platform/README.md)** — Extra platform detail (scripts table, extended API notes).

---

*This README is written for assessors and developers: it states assumptions (two apps, JSON vs SQL), maps requirements to behavior, and documents every setup step in order.*
