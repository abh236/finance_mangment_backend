# Finance Dashboard Platform

> **Full assignment-style guide (requirements, every setup step, examples):** see the parent **[README.md](../README.md)**.  
> **Quick workspace map:** **[../docs/WORKSPACE.md](../docs/WORKSPACE.md)**.

Unified **Node.js + Express** backend for a role-based finance dashboard. It combines:

- **`backend/finance-dashboard`** — Knex data access, financial records, soft deletes, SQL-backed dashboard aggregates.
- **`Zorvyn-backend-task-main`** — OpenAPI-style docs, Swagger UI, structured JSON responses (`success`), layered middleware (auth, validation, rate limits).

---

## Prerequisites

- **Node.js** 18 or newer  
- **npm** (bundled with Node)

Optional:

- **Docker** — for local PostgreSQL (`docker compose`).

---

## Quick start

From the **parent** `backend1` folder (recommended once root deps are installed):

```bash
npm run install:platform
npm run dev:platform
```

From **inside** this folder:

```bash
cd finance-dashboard-platform
npm install
npm run dev
```

Create `.env` from the example (see [Environment variables](#environment-variables)):

| OS | Command |
|----|---------|
| Windows (PowerShell) | `Copy-Item .env.example .env` |
| macOS / Linux | `cp .env.example .env` |

Start the API:

```bash
npm run dev
```

| URL | Purpose |
|-----|---------|
| `http://localhost:4000/` | Short HTML landing page with links |
| `http://localhost:4000/health` | JSON health check |
| `http://localhost:4000/api/docs` | **Swagger UI** (interactive API docs) |

**Migrations** run automatically when the server starts, unless you set `SKIP_DB_MIGRATE=true`.

### Optional: seed admin user

```bash
npm run seed
```

Default credentials (change in production):

- **Email:** `admin@example.com`  
- **Password:** `admin123`

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | HTTP port |
| `NODE_ENV` | No | `development` | `development` / `production` (affects logging, Knex env) |
| `JWT_SECRET` | **Yes** (non-dev) | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | JWT lifetime (e.g. `12h`, `7d`) |
| `DB_CLIENT` | No | `sqlite3` | `sqlite3` or `pg` |
| `DATABASE_URL` | For `pg` | — | PostgreSQL connection string |
| `PG_SSL` | No | `false` | Set `true` if the DB requires SSL (e.g. some cloud hosts) |
| `SKIP_DB_MIGRATE` | No | — | Set `true` to skip `migrate:latest` on boot |

**SQLite:** database file is created under `data/finance.db` (see `knexfile.js`).

---

## Database: PostgreSQL (recommended for higher concurrency)

From the project root:

```bash
docker compose up -d
```

In `.env`:

```env
DB_CLIENT=pg
DATABASE_URL=postgresql://finance:finance@localhost:5432/finance_dashboard
```

Then:

```bash
npm run dev
```

Adjust credentials in `docker-compose.yml` and `DATABASE_URL` if you change them.

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run with **nodemon** (auto-restart on file changes) |
| `npm start` | Run with **node** (production-style) |
| `npm run migrate` | Apply Knex migrations only |
| `npm run migrate:rollback` | Roll back last migration batch |
| `npm run seed` | Run seed files (e.g. demo admin) |

---

## Assignment → implementation

| Requirement | How it is implemented |
|-------------|----------------------|
| User & role management | Register/login; roles `viewer`, `analyst`, `admin`; admin lists/updates users and `active` / `inactive` status |
| Financial entries | Amount, type (`income` / `expense`), category, date, notes; CRUD + soft delete |
| Filtering & listing | `type`, `category`, date range, search `q`; pagination `page` / `limit` |
| Dashboard summaries | Totals, category breakdown, monthly/weekly trends, recent activity — **SQL aggregates**, not full-table loads in memory |
| Access control | **Route-level** middleware: JWT + role checks |
| Validation & errors | `express-validator`; `422` validation; consistent `{ success, error, details? }` |
| Persistence | SQLite (dev) or PostgreSQL (recommended); schema + **indexes** via Knex migrations |

### Role matrix

| Role | Dashboard (`/api/dashboard/*`) | Records |
|------|--------------------------------|---------|
| **viewer** | Read-only (aggregates, trends, activity) | No access |
| **analyst** | Same as viewer | **Read only** (`GET /api/records`, `GET /api/records/:id`) |
| **admin** | Same | Full CRUD; **soft delete** on delete |
| **admin** | — | **User management** (`/api/users`) |

---

## API reference

Base path: **`/api`**

All protected routes expect:

```http
Authorization: Bearer <your_jwt_token>
```

### Auth

- `POST /api/auth/register` — body: `name`, `email`, `password`, optional `role`
- `POST /api/auth/login` — body: `email`, `password` → returns `token` + `user`
- `GET /api/auth/me` — current user (requires token)

### Users (admin only)

- `GET /api/users` — query: `page`, `limit`
- `GET /api/users/:id`
- `PATCH /api/users/:id` — body (optional fields): `name`, `role`, `status` (`active` | `inactive`)

### Records

- `GET /api/records` — **analyst, admin** — query: `type`, `category`, `startDate`, `endDate`, `q`, `page`, `limit`
- `GET /api/records/:id` — **analyst, admin**
- `POST /api/records` — **admin** — body: `amount`, `type`, `category`, `date` (ISO 8601), optional `notes`
- `PATCH /api/records/:id` — **admin** — partial update
- `DELETE /api/records/:id` — **admin** — **soft delete** (`deleted_at` set)

### Dashboard (viewer, analyst, admin)

- `GET /api/dashboard/summary` — income, expenses, net, record count
- `GET /api/dashboard/categories` — totals by category and type
- `GET /api/dashboard/trends/monthly` — query: optional `months` (1–24)
- `GET /api/dashboard/trends/weekly`
- `GET /api/dashboard/activity` — query: optional `limit` (1–50)

### Example: register and call dashboard

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Viewer",
  "email": "viewer@example.com",
  "password": "secret123",
  "role": "viewer"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "viewer@example.com",
  "password": "secret123"
}
```

Then:

```http
GET /api/dashboard/summary
Authorization: Bearer <token>
```

---

## HTTP status codes (typical)

| Code | When |
|------|------|
| `200` | Success |
| `201` | Created (register, new record) |
| `401` | Missing/invalid JWT |
| `403` | Wrong role or inactive account |
| `404` | User/record/route not found |
| `409` | Email already registered |
| `422` | Validation failed (see `details`) |
| `429` | Rate limit (especially auth routes) |
| `500` | Unexpected server error |

---

## Scaling notes (~10k users / assessment context)

This is **not** a full production platform, but the design favors a path that stays efficient as data and traffic grow:

1. **PostgreSQL** + indexes on hot filter/aggregate columns.
2. **Connection pooling** in `knexfile.js` (tuned higher in `production`).
3. **Heavy math in SQL** for dashboard endpoints.
4. **Rate limiting** and security headers (**helmet**) + **compression**.

Further steps for real production: read replicas, cache for dashboard snapshots, horizontal app instances, structured logging, and secrets management.

---

## Project structure

```
finance-dashboard-platform/
├── data/                  # SQLite file (dev) — gitignored except .gitkeep
├── src/
│   ├── app.js             # Express app, middleware, routes, Swagger
│   ├── server.js          # Starts server + runs migrations
│   ├── config/            # Knex / DB wiring
│   ├── db/
│   │   ├── migrations/    # Schema + indexes
│   │   └── seeds/         # Optional seed data
│   ├── docs/
│   │   └── openapi.spec.js
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── docker-compose.yml     # Local PostgreSQL
├── knexfile.js
├── package.json
└── .env.example
```

---

## Troubleshooting

| Issue | What to try |
|------|-------------|
| Port already in use | Set `PORT=4001` (or another free port) in `.env` |
| `EADDRINUSE` | Stop another process on the same port or change `PORT` |
| Browser shows blank page on `/` | Use `http://localhost:<PORT>/` (not `https` unless you terminate TLS elsewhere) |
| `npm install` / file errors on OneDrive | Clone or copy the project to a non-synced folder (e.g. `C:\dev\...`) and run `npm install` again |
| Migrations fail on Postgres | Check `DATABASE_URL`, ensure Postgres is up, and `DB_CLIENT=pg` |
| JWT errors | Set a strong `JWT_SECRET` in `.env`; restart the server after changes |

---

## Tradeoffs & assumptions

- **JWT only** — no refresh-token rotation in this repo.
- **Date field** is stored as an ISO-friendly string for SQLite/Postgres portability; for strict reporting at very large scale, a dedicated `timestamptz` column is a natural next migration.
- **Soft-deleted** rows are excluded from queries used for dashboards and lists.

---

## Credits

- Domain model, Knex usage, finance analytics: `backend/finance-dashboard`
- API documentation pattern and middleware discipline: `Zorvyn-backend-task-main`
