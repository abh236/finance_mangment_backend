# Finance Dashboard Backend — Complete Guide

This repository implements a **Node.js + Express** backend for a **finance dashboard** where users with different **roles** access **financial records** and **summary analytics**. Everything below is written so you can **install from zero**, **understand each requirement**, and **run and test** the system step by step.

### Repository layout (two separate apps)

There are **two folders** with **two different servers**. They do **not** share code paths for data; pick one (or run the other on a different port).

```text
backend1/                          ← you are here (workspace root)
├── README.md                      ← this file only (full documentation)
├── .gitignore                     ← one file for the whole repo
├── .env.example                   ← template for the LITE API only
├── env.platform.example           ← template for the PLATFORM API (copy into subfolder)
├── package.json                   ← scripts for lite + shortcuts to platform
├── src/                           ← Lite API source
├── data/db.json                   ← Lite API storage
└── finance-dashboard-platform/    ← Platform API (MongoDB, Mongoose, Swagger)
    ├── README.md                  ← short pointer back to this README
    ├── package.json
    ├── src/
    └── data/                      ← optional; legacy SQLite path (platform uses MongoDB only)
```

---

## Table of contents

1. [What is in this folder (two apps)](#1-what-is-in-this-folder-two-apps)
2. [Which app to use for the assignment](#2-which-app-to-use-for-the-assignment)
3. [Assignment requirements — how each is met](#3-assignment-requirements--how-each-is-met)
4. [Prerequisites](#4-prerequisites)
5. [Platform setup — full detailed walkthrough](#5-platform-setup--full-detailed-walkthrough)
6. [Environment variables (explained)](#6-environment-variables-explained)
7. [NPM scripts (from repository root)](#7-npm-scripts-from-repository-root)
8. [Authentication flow (every step)](#8-authentication-flow-every-step)
9. [API reference (endpoints and roles)](#9-api-reference-endpoints-and-roles)
10. [Example requests (copy/paste)](#10-example-requests-copypaste)
11. [Financial record fields and rules](#11-financial-record-fields-and-rules)
12. [Dashboard analytics (what each endpoint returns)](#12-dashboard-analytics-what-each-endpoint-returns)
13. [Validation, errors, and HTTP status codes](#13-validation-errors-and-http-status-codes)
14. [Data persistence (where data lives)](#14-data-persistence-where-data-lives)
15. [Optional features included](#15-optional-features-included)
16. [Project structure (files and folders)](#16-project-structure-files-and-folders)
17. [How this maps to typical evaluation criteria](#17-how-this-maps-to-typical-evaluation-criteria)
18. [Troubleshooting](#18-troubleshooting)
19. [Further reading](#19-further-reading)

---

## 1. What is in this folder (two apps)

| Location | Name | Purpose |
|----------|------|---------|
| Repository **root** (`src/`, `data/db.json`) | **Lite API** | Smaller demo: **JSON file** storage, **Zod** validation, **JWT**. Good for quick tests **without** MongoDB. |
| **`finance-dashboard-platform/`** | **Platform API** | **Main** submission-style app: **MongoDB** + **Mongoose**, **indexes**, **Swagger UI**, **rate limits**, **soft deletes**, **aggregation pipelines** for the dashboard. |

**Important:** The two apps are **not linked**. They do **not** share one database. You choose one to run (or run the other on a **different `PORT`**).

---

## 2. Which app to use for the assignment

For requirements that mention **database persistence**, **scalability**, and **clear API documentation**, use:

**`finance-dashboard-platform`**

The lite root app still satisfies **Node + Express** and **RBAC/CRUD** at a simpler level, but the **platform** matches the brief more completely (MongoDB-backed persistence, structured docs, operational middleware).

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
| Fields: amount, type, category, date, notes | Yes — see Mongoose schemas in `finance-dashboard-platform/src/models/` and route validators | Yes — Zod in `src/validators/recordValidators.js` |
| Create | `POST /api/records` (**admin**) | `POST /api/records` (permission `records:create`) |
| Read / list / filter | `GET /api/records` (**analyst, admin**) — filter `type`, `category`, dates, search `q`, pagination | `GET /api/records` with filters |
| Update | `PATCH /api/records/:id` (**admin**) | `PATCH` with permission |
| Delete | `DELETE` — **soft delete** (`deletedAt` in DB; responses may still expose timestamps in snake_case) | Hard delete in JSON store (implementation choice) |

---

### 3) Dashboard summary APIs

| Requirement | Platform | Lite |
|-------------|----------|------|
| Total income / expenses / net | `GET /api/dashboard/summary` — MongoDB **aggregation** in `finance-dashboard-platform/src/services/dashboardService.js` | `GET /api/dashboard/summary` — in-memory aggregates over JSON in `src/services/dashboardService.js` |
| Category totals | `GET /api/dashboard/categories` | **Not exposed** as a separate route (only `summary` exists in `src/routes/dashboardRoutes.js`) |
| Recent activity | `GET /api/dashboard/activity` | **Not in lite** |
| Monthly / weekly trends | `GET /api/dashboard/trends/monthly`, `trends/weekly` | **Not in lite** |

Aggregates are computed **in MongoDB** on the platform side, which is what reviewers usually want for “not just CRUD.” For the **full** dashboard requirement set, **use the platform**.

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
| Storage | **MongoDB** — connection string in `MONGODB_URI` | **JSON:** `data/db.json` |
| Local DB | **Docker:** `docker compose` in `finance-dashboard-platform/` (MongoDB on port `27017`) or any reachable MongoDB instance | N/A (file only) |

If you use **only** the JSON file approach, say so in documentation — **this README does**.

---

## 4. Prerequisites

1. **Node.js** version **18 or newer** (LTS recommended).  
   Check: `node -v`
2. **npm** (comes with Node).  
   Check: `npm -v`
3. **Git** (optional, for version control).
4. **Docker Desktop** (optional) — convenient way to run **MongoDB** locally via `docker compose` in `finance-dashboard-platform/`.

---

## 5. Platform setup — full detailed walkthrough

This section walks through **every step** to run **`finance-dashboard-platform`** (the MongoDB API) from a clean machine. Read **5.1** first, then follow **one** MongoDB path (**5.5**–**5.8**), then **5.9** onward.

### 5.1 Before you start (checklist)

1. Open a terminal (PowerShell on Windows, Terminal on macOS/Linux).
2. Confirm Node.js is installed: run `node -v`. You should see **v18** or newer. If not, install Node.js LTS from [nodejs.org](https://nodejs.org/).
3. Confirm npm works: run `npm -v`.
4. Decide how you will run MongoDB (see **5.5**). You do **not** need Docker if you use Atlas or in-memory dev.

### 5.2 Navigate to the repository folder

1. In the terminal, change directory to the workspace root (the folder that contains `package.json` and `finance-dashboard-platform`).
2. **Windows (PowerShell) example** (replace the path with yours):

   ```powershell
   cd "C:\Users\YourName\OneDrive\Desktop\backend1"
   ```

3. **macOS / Linux example:**

   ```bash
   cd ~/projects/backend1
   ```

4. Confirm you are in the right place: `dir` (Windows) or `ls` (macOS/Linux) should show `finance-dashboard-platform` and `README.md`.

### 5.3 Install Node dependencies

1. From the **repository root** (`backend1`), run:

   ```bash
   npm run install:all
   ```

2. **What this command does:**
   - Runs `npm install` in the root (dependencies for the **lite** API, if you use it later).
   - Runs `npm install` inside **`finance-dashboard-platform`** (Express, Mongoose, Swagger, etc.).

3. **Expected result:** No `ERR!` at the end; you should see something like `added X packages` and `audited`.

4. **If `npm install` fails with `EPERM` or permission errors (common on OneDrive/Desktop sync):** copy the whole project to a local folder such as `C:\dev\backend1`, open the terminal there, and run `npm run install:all` again.

5. **If you only want the platform** (skip lite root deps):

   ```bash
   npm run install:platform
   ```

### 5.4 Create and edit the platform environment file (.env)

The platform reads **`finance-dashboard-platform/.env`**. There is **no** committed `.env` in git (secrets stay local).

1. **Copy the template** from the repo root:

   **Windows (PowerShell), from repository root:**

   ```powershell
   Copy-Item .\env.platform.example .\finance-dashboard-platform\.env
   ```

   **macOS / Linux:**

   ```bash
   cp env.platform.example finance-dashboard-platform/.env
   ```

2. **Open** `finance-dashboard-platform/.env` in any text editor.

3. **Set these variables (minimum):**

   | Variable | What to put | Notes |
   |----------|-------------|--------|
   | `PORT` | `4000` | If something else already uses 4000, use `4001` (and use that port in all URLs below). |
   | `JWT_SECRET` | A long random string (32+ characters) | Used to sign JWTs. Never commit real secrets. Example for **local dev only**: `local-dev-change-me-please-use-random-string-12345`. |
   | `MONGODB_URI` | See **5.5**–**5.8** | Must match **how** you run MongoDB. |

4. **Optional:** `JWT_EXPIRES_IN` (default in code is often `7d`). Leave as in `env.platform.example` unless you need a shorter token lifetime.

5. **Save** the file. The server only reads `.env` when it **starts** — restart the server after any change.

### 5.5 Choose how MongoDB will run (pick one path)

| Path | When to use | `MONGODB_URI` pattern |
|------|-------------|------------------------|
| **A — Docker** | You have Docker Desktop (or Docker Engine) and want MongoDB in a container. | `mongodb://127.0.0.1:27017/finance_dashboard` |
| **B — MongoDB Atlas** | You prefer a cloud database (free tier available). | `mongodb+srv://USER:PASSWORD@cluster.../finance_dashboard?...` (from Atlas UI) |
| **C — In-memory (development)** | You cannot install MongoDB or Docker; you only need local API dev/tests. | **No** `MONGODB_URI` in `.env` is **not** used — see **5.8** (script sets URI at runtime). |
| **D — Native MongoDB install** | You installed MongoDB Community Server on your PC. | Usually `mongodb://127.0.0.1:27017/finance_dashboard` if default port. |

---

### 5.6 Path A — MongoDB with Docker (detailed)

**Goal:** Start MongoDB in Docker, then point the app at `localhost:27017`.

1. **Install Docker Desktop** (Windows/macOS) or Docker Engine (Linux) if you do not have it. Verify: `docker --version` and `docker compose version`.

2. **Start only the database** from the folder that contains `docker-compose.yml`:

   ```bash
   cd finance-dashboard-platform
   docker compose up -d
   ```

3. **Check the container is running:**

   ```bash
   docker compose ps
   ```

   You should see a service (e.g. `mongo`) with state **running**.

4. **Optional — view logs** if something fails:

   ```bash
   docker compose logs mongo
   ```

5. **Set** in `finance-dashboard-platform/.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/finance_dashboard
   ```

6. **Stop MongoDB later** (when you are done developing):

   ```bash
   cd finance-dashboard-platform
   docker compose down
   ```

   Data is kept in a Docker volume unless you remove volumes explicitly.

---

### 5.7 Path B — MongoDB Atlas (cloud, detailed)

**Goal:** Create a cluster in Atlas and paste its connection string into `.env`.

1. Sign up or log in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **project** and a **cluster** (free M0 is fine for development).
3. **Database access:** create a database user (username + password). Save the password securely.
4. **Network access:** add your IP address (or `0.0.0.0/0` for testing only — not recommended for production).
5. In Atlas, click **Connect** on your cluster → **Drivers** → copy the **connection string** (it starts with `mongodb+srv://`).
6. Replace `<password>` in the string with your user’s password (URL-encode special characters if needed).
7. Append a database name if missing, e.g. `/finance_dashboard`, and keep query params such as `retryWrites=true&w=majority` if Atlas provides them.
8. Put the full string in `finance-dashboard-platform/.env` as **`MONGODB_URI=...`** (one line, no spaces around `=`).
9. Start the API (**5.9**). If connection fails, re-check network access (IP allowlist) and password.

---

### 5.8 Path C — In-memory MongoDB (no local MongoDB install)

**Goal:** Run the API with an embedded MongoDB for development when you cannot run Docker or Atlas.

1. Complete **5.3** and **5.4** (install deps; create `.env` with **`JWT_SECRET`** at least — `MONGODB_URI` in `.env` is **ignored** for this mode because the helper script sets a temporary URI before starting the server).
2. From **repository root**:

   ```bash
   npm run dev:platform:memory
   ```

   Or from **`finance-dashboard-platform`**:

   ```bash
   npm run dev:memory
   ```

3. **What happens:** `mongodb-memory-server` downloads a MongoDB binary on first run (can be large), starts it, connects Mongoose, then starts Express. Data lives **only in RAM** — it is lost when you stop the process.

4. **Use for:** quick local development when MongoDB is not installed. **Not** for production.

---

### 5.9 Start the platform API (normal mode)

Use this after **5.6**, **5.7**, or **D** (native Mongo) — **not** for **5.8** (use **5.8** commands instead).

1. Ensure **`MONGODB_URI`** in `finance-dashboard-platform/.env` matches your MongoDB (Docker, Atlas, or local `mongod`).
2. From **repository root**:

   ```bash
   npm run dev:platform
   ```

   This runs **nodemon** (auto-restarts on file changes).

3. **Or** production-style (no auto-restart):

   ```bash
   npm run start:platform
   ```

4. **Or** from inside **`finance-dashboard-platform`**:

   ```bash
   cd finance-dashboard-platform
   npm run dev
   ```

   or `npm start`.

### 5.10 Confirm the server and database connection

1. Watch the terminal. **Success** looks like:
   - `Finance Dashboard Platform listening on http://localhost:4000` (or your `PORT`)
   - `MongoDB connected`
   - `Swagger UI: http://localhost:4000/api/docs`

2. **Failure** often looks like:
   - `MongoDB connection failed:` — wrong `MONGODB_URI`, MongoDB not running, or network/firewall blocking Atlas.

3. **Browser checks** (replace `4000` if you changed `PORT`):

   | Step | URL | What you should see |
   |------|-----|---------------------|
   | 1 | `http://localhost:4000/` | Small HTML page with links to `/api/docs` and `/health`. |
   | 2 | `http://localhost:4000/health` | JSON: `{"ok":true,"service":"finance-dashboard-platform"}`. |
   | 3 | `http://localhost:4000/api/docs` | Swagger UI listing routes. |

4. **Command-line check (optional):**

   **PowerShell:**

   ```powershell
   Invoke-RestMethod -Uri "http://localhost:4000/health"
   ```

   **curl:**

   ```bash
   curl http://localhost:4000/health
   ```

### 5.11 Optional — seed a default admin user

1. With MongoDB running and `.env` configured, from **repository root**:

   ```bash
   npm run seed:platform
   ```

2. **First run:** creates user **admin@example.com** / **admin123** (role **admin**), if that email does not exist.
3. **Second run:** prints that the admin already exists (safe to run multiple times).
4. **Security:** change the password in real deployments; do not rely on default credentials.

### 5.12 First API usage (Swagger or HTTP client)

1. Open **`http://localhost:4000/api/docs`**.
2. Use **POST `/api/auth/register`** to create a user, or **POST `/api/auth/login`** if you used **5.11**.
3. Click **Authorize** in Swagger (if available) or send header `Authorization: Bearer <token>` on protected routes.
4. Copy/paste examples from [§10 Example requests](#10-example-requests-copypaste).

### 5.13 Automated API tests (platform)

1. From **repository root**:

   ```bash
   npm run test:platform
   ```

2. **Or** inside **`finance-dashboard-platform`**:

   ```bash
   npm test
   ```

3. **What it does:** starts an in-memory MongoDB and a temporary server on port **4010** (override with env `TEST_PORT`), runs integration checks (auth, RBAC, records, dashboard, users), then exits. **Exit code 0** means all checks passed.

4. **First run** may download a MongoDB binary for `mongodb-memory-server` (large download; later runs are faster).

---

### 5.14 Lite JSON API (optional, separate app)

The **root** `src/` server stores data in **`data/db.json`**. It does **not** use MongoDB and does **not** share data with the platform.

1. **Install** (repository root only):

   ```bash
   npm install
   ```

2. **Environment:** copy the lite template:

   **Windows:**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux:**

   ```bash
   cp .env.example .env
   ```

3. Edit **`.env`** at the **root** (not `finance-dashboard-platform/.env`): set **`JWT_SECRET`**; set **`PORT`** to something other than **`4000`** if the platform is already using 4000 (e.g. **`PORT=3000`**).

4. **Run:**

   ```bash
   npm run dev
   ```

5. **Verify:** `http://localhost:3000/health` (or your `PORT`) — response shape differs slightly from the platform (`status: ok` in lite vs `ok: true` on platform — see lite `src/app.js`).

6. **Data file:** `data/db.json` — back it up if you care about the data; it is independent of MongoDB.

---

## 6. Environment variables (explained)

### Platform (`finance-dashboard-platform/.env`)

Create this file by copying **`env.platform.example`** from the repository root (step-by-step in [§5](#5-platform-setup--full-detailed-walkthrough)).

| Variable | Required | Meaning |
|----------|----------|---------|
| `PORT` | No | HTTP port. If omitted, the app defaults to **4000**. Must match the URL you use in the browser (e.g. `http://localhost:4000`). |
| `NODE_ENV` | No | Usually **`development`** locally or **`production`** when deployed. Affects request logging verbosity (`morgan` format). |
| `JWT_SECRET` | **Yes for real use** | Symmetric secret used to **sign** JWT access tokens. If two servers share the same users database, they must share the same secret. Use a long random string; never commit production secrets to git. |
| `JWT_EXPIRES_IN` | No | How long issued JWTs remain valid (e.g. **`7d`**, **`12h`**). Passed to `jsonwebtoken`. If omitted, the app’s code supplies a default. |
| `MONGODB_URI` | **Yes** (except **§5.8** in-memory mode) | Full MongoDB connection URI. **Local Docker / native:** `mongodb://127.0.0.1:27017/finance_dashboard`. **Atlas:** `mongodb+srv://...` from the Atlas UI. Database name is usually the path segment after the host (e.g. `finance_dashboard`). |

**Notes:**

- Lines starting with `#` in `.env` are comments.
- Do **not** wrap values in quotes unless your password or URI genuinely requires them.
- After editing `.env`, **restart** the Node process so new values load.

### Lite (root `.env`)

Used only by the **lite** API (`npm run dev` at repo root). Copy from **`.env.example`**.

| Variable | Meaning |
|----------|---------|
| `PORT` | HTTP port for the lite server (defaults to **4000** in code if unset — change if the platform already uses 4000). |
| `JWT_SECRET` | Same role as on the platform: signs JWTs for the lite app only. |

---

## 7. NPM scripts (from repository root)

| Command | What it does |
|---------|----------------|
| `npm run install:all` | Installs root + platform dependencies (same as running `npm install` twice). |
| `npm run install:platform` | Installs only **`finance-dashboard-platform`** dependencies. |
| `npm run dev:platform` | Platform API with **nodemon** (reload on file changes). Requires **`MONGODB_URI`** in `finance-dashboard-platform/.env` and a reachable MongoDB. |
| `npm run dev:platform:memory` | Platform API using **in-memory MongoDB** (see [§5.8](#58-path-c--in-memory-mongodb-no-local-mongodb-install)); no separate MongoDB install needed. |
| `npm run start:platform` | Platform API with **`node`** (no nodemon); use for production-style runs. |
| `npm run seed:platform` | Runs the platform seed script once: creates **admin@example.com** if missing (see [§5.11](#511-optional--seed-a-default-admin-user)). |
| `npm run test:platform` | Runs **automated integration tests** for the platform (in-memory MongoDB + temp port; see [§5.13](#513-automated-api-tests-platform)). |
| `npm run dev` | Lite API at repo root (nodemon). |
| `npm start` | Lite API at repo root (`node`). |

**Inside `finance-dashboard-platform`** (run `cd finance-dashboard-platform` first), the same ideas map to:

| Command | What it does |
|---------|----------------|
| `npm run dev` | Nodemon + your **`MONGODB_URI`**. |
| `npm run dev:memory` | In-memory MongoDB wrapper + nodemon. |
| `npm start` | `node src/server.js`. |
| `npm run seed` | Seed admin user. |
| `npm test` | Same as root’s `npm run test:platform`. |

---

## 8. Authentication flow (every step)

### Registration

1. Client sends `POST /api/auth/register` with JSON body (`name`, `email`, `password`, optional `role`).  
2. Server validates input.  
3. Password is **hashed** (bcrypt).  
4. User document is stored in MongoDB.  
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

## 9. API reference (endpoints and roles)

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

## 10. Example requests (copy/paste)

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

## 11. Financial record fields and rules

| Field | Type / values | Notes |
|-------|----------------|-------|
| `amount` | Positive number | Expense amounts are still **positive** in storage; **type** distinguishes income vs expense. |
| `type` | `income` \| `expense` | Required |
| `category` | String | Required |
| `date` | ISO 8601 datetime string | Required on create |
| `notes` | String, optional | |

**Platform:** deleted records have `deletedAt` set and are **excluded** from normal list/dashboard queries.

---

## 12. Dashboard analytics (what each endpoint returns)

| Endpoint | Purpose |
|----------|---------|
| `/summary` | Total income, total expenses, net balance, record count — **MongoDB aggregation**. |
| `/categories` | Breakdown by **category** and **type** with sums. |
| `/trends/monthly` | Buckets by **month**; income, expenses, net per bucket. |
| `/trends/weekly` | Buckets by **week**; income and expenses. |
| `/activity` | Latest N entries (for “recent activity” on a UI). |

This demonstrates **aggregated** API design, not only CRUD.

---

## 13. Validation, errors, and HTTP status codes

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

## 14. Data persistence (where data lives)

| App | Storage | Location |
|-----|---------|----------|
| Platform | **MongoDB** | Any host URI in `MONGODB_URI` (e.g. Docker on `localhost:27017`) |
| Lite | JSON | `data/db.json` |

**Tradeoff stated clearly:** the **lite** app uses a **simplified JSON file** database suitable for demos; the **platform** uses **MongoDB** with Mongoose schemas and indexes.

---

## 15. Optional features included

| Enhancement | Platform | Lite |
|-------------|----------|------|
| JWT authentication | Yes | Yes |
| Pagination | Yes (`page`, `limit`) | Yes |
| Search | `q` on records (category/notes) | Varies |
| Soft delete | Yes | No (JSON store) |
| Rate limiting | Yes (`/auth` + API) | No |
| API docs | **Swagger UI** `/api/docs` | No |

**Automated checks:** the platform includes **`npm run test:platform`** (integration smoke tests against a disposable in-memory database; see [§5.13](#513-automated-api-tests-platform)).

**Not included by default:** refresh tokens, full Jest/Mocha unit suite, CI pipelines — add if your rubric requires them.

---

## 16. Project structure (files and folders)

```text
backend1/
├── README.md                 ← This file (master guide)
├── docs/
│   └── WORKSPACE.md          ← Quick map + script index
├── package.json              ← Root scripts (dev:platform, install:all, …)
├── .gitignore                ← One file for lite + platform
├── .env.example              ← Lite API env template only
├── env.platform.example      ← Copy → finance-dashboard-platform/.env
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
    ├── README.md             ← Short pointer to parent README (no duplicate docs)
    ├── package.json
    ├── docker-compose.yml    ← optional local MongoDB
    ├── .env                  ← you create this from ../env.platform.example
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        ├── scripts/          ← e.g. seedAdmin.js, runApiTests.js, devWithMemoryMongo.js
        ├── docs/openapi.spec.js
        ├── middleware/
        ├── routes/
        ├── controllers/
        ├── services/
        └── models/
```

*(Paths match the repo; `docker-compose.yml` lives in `finance-dashboard-platform/`.)*

---

## 17. How this maps to typical evaluation criteria

| Criterion | How the repo addresses it |
|-----------|----------------------------|
| Backend design | Separate **routes → controllers → services/models**; config and middleware isolated. |
| Logical thinking | RBAC explicit per route; aggregates in MongoDB; soft delete for history. |
| Functionality | Auth, users, CRUD, filters, dashboard endpoints (platform). |
| Code quality | Consistent naming, small modules, README + workspace docs. |
| Database modeling | **users** + **financialrecords** collections, references, indexes (platform). |
| Validation / reliability | Validators + error middleware; meaningful status codes. |
| Documentation | **This README** (single full guide) + [docs/WORKSPACE.md](docs/WORKSPACE.md); platform folder has a short [README](finance-dashboard-platform/README.md) pointer only. |
| Extra thoughtfulness | Swagger, rate limits, helmet, compression, Docker Compose for MongoDB, optional in-memory Mongo for dev, automated API smoke tests. |

---

## 18. Troubleshooting

| Problem | What to try |
|---------|-------------|
| Port already in use (`EADDRINUSE`) | In `finance-dashboard-platform/.env`, set **`PORT`** to another value (e.g. `4001`). On Windows, open Command Prompt and run `netstat -ano` to find the PID listening on port 4000, then end that task in Task Manager (Details tab). |
| Cannot run lite + platform at once | Both default to port **4000**. Set different **`PORT`** values in **root** `.env` (lite) and **`finance-dashboard-platform/.env`** (platform). |
| `npm install` errors on OneDrive / Desktop sync | Copy the project to a non-synced folder (e.g. `C:\dev\backend1`) and run `npm run install:all` again. |
| JWT / **401** on protected routes | Ensure **`JWT_SECRET`** is set in the correct `.env`, restart the server, and obtain a new token via **login**. Check `Authorization: Bearer <token>` header spelling. |
| **403** Forbidden | Your user’s **role** may not allow the route (e.g. viewer cannot `GET /api/records`). See [§9 API reference](#9-api-reference-endpoints-and-roles). |
| MongoDB connection failed / timeout | Verify **`MONGODB_URI`**, that `mongod` or Docker is running (`docker compose ps`), and for **Atlas** that your IP is allowlisted and password is correct. |
| `MONGODB_URI is not set` | Copy **`env.platform.example`** to **`finance-dashboard-platform/.env`** and add **`MONGODB_URI=...`**, or use **`npm run dev:platform:memory`** for in-memory dev. |
| `dev:memory` / **`npm test`** downloads a huge file | **mongodb-memory-server** downloads a MongoDB binary on first use; wait for it to finish. Later runs use a cache and are faster. |
| Seed says admin exists but you forgot password | Register a new admin with **`POST /api/auth/register`** and **`role: "admin"`**, or reset data by pointing **`MONGODB_URI`** at a fresh database name. |

---

## 19. Further reading

- **[docs/WORKSPACE.md](docs/WORKSPACE.md)** — Short linked index and “what to run first.”
- **[finance-dashboard-platform/README.md](finance-dashboard-platform/README.md)** — One-page pointer back here (no second copy of the long guide).

---

*This README is written for assessors and developers: it states assumptions (two apps, JSON lite vs MongoDB platform), maps requirements to behavior, and documents every setup step in order.*
