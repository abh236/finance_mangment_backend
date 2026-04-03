# Finance Dashboard Backend

A **Node.js + Express** REST API for a finance dashboard system with role-based access control, financial records management, dashboard analytics, JWT authentication, and MongoDB persistence.

**Live API:** https://finance-mangment-backend-k6zr.vercel.app  
**Swagger Docs:** https://finance-mangment-backend-k6zr.vercel.app/api/docs

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Assignment Requirements — How Each Is Met](#assignment-requirements--how-each-is-met)
4. [Roles and Access Control](#roles-and-access-control)
5. [API Reference](#api-reference)
6. [Setup and Running Locally](#setup-and-running-locally)
7. [Environment Variables](#environment-variables)
8. [Authentication Flow](#authentication-flow)
9. [Data Models](#data-models)
10. [Dashboard Analytics](#dashboard-analytics)
11. [Validation and Error Handling](#validation-and-error-handling)
12. [Optional Features Included](#optional-features-included)
13. [Assumptions and Tradeoffs](#assumptions-and-tradeoffs)
14. [Project Structure](#project-structure)

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js 18+ | LTS, wide ecosystem |
| Framework | Express 4 | Minimal, flexible, well-understood |
| Database | MongoDB (Mongoose) | Document model fits financial records; aggregation pipelines for analytics |
| Auth | JWT (jsonwebtoken + bcryptjs) | Stateless, easy to verify across services |
| Validation | express-validator | Per-route declarative validation |
| Docs | Swagger UI (openapi 3) | Self-documenting API |
| Rate limiting | express-rate-limit | Protects auth and global endpoints |
| Deployment | Vercel (serverless) | Zero-config Node deployment |

---

## Architecture Overview

```
finance-dashboard-platform/
├── src/
│   ├── app.js              ← Express app, middleware, route mounting, lazy DB connect
│   ├── server.js           ← HTTP server bootstrap (local only)
│   ├── config/
│   │   ├── database.js     ← Mongoose connect + isConnected()
│   │   └── roles.js        ← ROLES and ROLE_LEVELS constants
│   ├── models/
│   │   ├── User.js         ← Mongoose schema + toPublicUser()
│   │   ├── userModel.js    ← Query layer (findById, create, update, list)
│   │   ├── FinancialRecord.js  ← Mongoose schema with indexes
│   │   └── recordModel.js  ← Query layer (CRUD + soft delete)
│   ├── controllers/        ← Thin HTTP layer; delegates to models/services
│   ├── services/
│   │   ├── authService.js  ← register, login business logic
│   │   └── dashboardService.js ← MongoDB aggregation pipelines
│   ├── routes/             ← Express routers with validation + role guards
│   ├── middleware/
│   │   ├── auth.js         ← JWT verify + requireRoles()
│   │   ├── validate.js     ← express-validator result handler
│   │   ├── rateLimiters.js ← auth limiter + global API limiter
│   │   └── errorHandler.js ← notFound + global error handler
│   ├── docs/
│   │   └── openapi.spec.js ← OpenAPI 3 spec for Swagger UI
│   └── scripts/
│       ├── seedAdmin.js        ← Creates default admin user
│       ├── runApiTests.js      ← 20-scenario integration test suite
│       └── devWithMemoryMongo.js ← Local dev without MongoDB install
├── api/
│   └── index.js            ← Vercel serverless entry point
└── vercel.json             ← Vercel deployment config
```

**Separation of concerns:** routes handle HTTP, controllers handle request/response, models handle DB queries, services handle business logic and aggregations.

---

## Assignment Requirements — How Each Is Met

### 1. User and Role Management

- `POST /api/auth/register` — create users with name, email, password, role
- `GET /api/users` — list users with pagination (admin only)
- `GET /api/users/:id` — get single user (admin only)
- `PATCH /api/users/:id` — update name, role, status (admin only)
- User status: `active` | `inactive` — inactive users are rejected at login and on every authenticated request
- Roles enforced via `requireRoles(...roles)` middleware on every protected route

### 2. Financial Records Management

- Full CRUD: create, read, update, soft delete
- Fields: `amount`, `type` (income/expense), `category`, `date`, `notes`, `createdBy`
- Filtering: `type`, `category`, `startDate`, `endDate`, full-text search `q` (regex on category + notes)
- Pagination: `page` + `limit` on all list endpoints
- Soft delete: `deletedAt` timestamp set instead of removing — excluded from all queries

### 3. Dashboard Summary APIs

All powered by **MongoDB aggregation pipelines** (not in-memory JS):

- `GET /api/dashboard/summary` — total income, total expenses, net balance, record count
- `GET /api/dashboard/categories` — totals grouped by category and type
- `GET /api/dashboard/trends/monthly` — income/expenses/net per month (configurable window)
- `GET /api/dashboard/trends/weekly` — income/expenses per ISO week (last 8 weeks)
- `GET /api/dashboard/activity` — most recent N records with creator name

### 4. Access Control Logic

Enforced at route level via `authenticate` + `requireRoles` middleware:

| Role | Can do |
|------|--------|
| viewer | Dashboard endpoints only |
| analyst | Dashboard + read records (list, get one) |
| admin | Everything: full record CRUD + user management |

No role can bypass this — middleware runs before any controller logic.

### 5. Validation and Error Handling

- `express-validator` on every route with field-level error messages
- Consistent response shape: `{ success, error, details? }`
- All standard HTTP codes used correctly (see [Validation and Error Handling](#validation-and-error-handling))

### 6. Data Persistence

- MongoDB via Mongoose with defined schemas and indexes
- Indexes on `deletedAt`, `date`, `type`, `category`, `createdBy` for query performance
- Cloud: MongoDB Atlas (free tier M0)

---

## Roles and Access Control

```
viewer  → GET /api/dashboard/*
analyst → GET /api/dashboard/* + GET /api/records + GET /api/records/:id
admin   → everything above + POST/PATCH/DELETE /api/records + all /api/users/*
```

Implementation: `src/middleware/auth.js` — `authenticate()` verifies JWT and loads user from DB on every request. `requireRoles(...roles)` checks `req.user.role` against allowed roles.

---

## API Reference

Base URL: `https://finance-mangment-backend-k6zr.vercel.app` (or `http://localhost:4000` locally)

### Auth (public)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `name, email, password, role?` | Register new user |
| POST | `/api/auth/login` | `email, password` | Login → returns JWT token |
| GET | `/api/auth/me` | — | Current user info (requires token) |

### Users (admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update name, role, or status |

### Financial Records

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/records` | analyst, admin | List records with filters + pagination |
| GET | `/api/records/:id` | analyst, admin | Get single record |
| POST | `/api/records` | admin | Create record |
| PATCH | `/api/records/:id` | admin | Update record |
| DELETE | `/api/records/:id` | admin | Soft delete record |

Query params for `GET /api/records`: `type`, `category`, `startDate`, `endDate`, `q`, `page`, `limit`

### Dashboard (viewer, analyst, admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance, count |
| GET | `/api/dashboard/categories` | Totals grouped by category and type |
| GET | `/api/dashboard/trends/monthly` | Monthly trends (`?months=6`) |
| GET | `/api/dashboard/trends/weekly` | Weekly trends (last 8 weeks) |
| GET | `/api/dashboard/activity` | Recent records (`?limit=10`) |

---

## Setup and Running Locally

### Prerequisites

- Node.js 18+
- MongoDB (local, Docker, or Atlas)

### Install

```bash
npm install --prefix finance-dashboard-platform
```

### Configure

```bash
cp env.platform.example finance-dashboard-platform/.env
```

Edit `finance-dashboard-platform/.env` — set `MONGODB_URI` and `JWT_SECRET`.

### Run

```bash
# With MongoDB running locally or Atlas URI in .env
npm run dev --prefix finance-dashboard-platform

# Without any MongoDB install (uses in-memory MongoDB)
npm run dev:memory --prefix finance-dashboard-platform
```

### Seed admin user

```bash
npm run seed --prefix finance-dashboard-platform
# Creates: admin@example.com / admin123
```

### Run integration tests

```bash
npm test --prefix finance-dashboard-platform
# Spins up in-memory MongoDB, runs 20 API scenarios, exits 0 on pass
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | No | Token expiry, default `7d` |
| `PORT` | No | HTTP port, default `4000` |
| `NODE_ENV` | No | `development` or `production` |

---

## Authentication Flow

1. Register via `POST /api/auth/register` or use seeded admin
2. Login via `POST /api/auth/login` → receive `token`
3. Send `Authorization: Bearer <token>` on all protected requests
4. Middleware verifies JWT, loads user from DB, checks role
5. Inactive users are rejected at step 4 with `403`

---

## Data Models

### User

```js
{
  name: String,          // required
  email: String,         // required, unique, lowercase
  password: String,      // bcrypt hashed, never returned
  role: String,          // viewer | analyst | admin
  status: String,        // active | inactive
  createdAt: Date,
  updatedAt: Date
}
```

### FinancialRecord

```js
{
  amount: Number,        // positive, required
  type: String,          // income | expense, required
  category: String,      // required
  date: Date,            // required
  notes: String,         // optional
  createdBy: ObjectId,   // ref User, required
  deletedAt: Date,       // null = active, set = soft deleted
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: `deletedAt`, `date`, `type`, `category`, `createdBy`

---

## Dashboard Analytics

All queries filter `deletedAt: null` (exclude soft-deleted records).

- **summary** — single `$group` aggregation with conditional sums for income vs expense
- **categories** — `$group` by `{category, type}` with `$sum` on amount
- **monthly trends** — `$dateToString` format `%Y-%m` bucketing with income/expense/net
- **weekly trends** — `$isoWeekYear` + `$isoWeek` bucketing for last 56 days
- **activity** — `find` with `populate('createdBy', 'name')` sorted by `createdAt`

---

## Validation and Error Handling

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role or inactive account |
| 404 | Resource or route not found |
| 409 | Conflict (email already registered) |
| 422 | Validation failed (field-level details returned) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

All error responses follow: `{ "success": false, "error": "message", "details": [...] }`

---

## Optional Features Included

| Feature | Status |
|---------|--------|
| JWT authentication | Yes |
| Pagination | Yes — `page` + `limit` on all list endpoints |
| Search | Yes — `q` param on records (regex on category + notes) |
| Soft delete | Yes — `deletedAt` field, excluded from all queries |
| Rate limiting | Yes — auth routes (50/15min) + global API (300/min) |
| Integration tests | Yes — 20 scenarios, in-memory MongoDB, no external deps |
| Swagger / OpenAPI docs | Yes — `/api/docs` |
| Deployed API | Yes — Vercel + MongoDB Atlas |

---

## Assumptions and Tradeoffs

- **Expense amounts are stored as positive numbers** — the `type` field (income/expense) determines direction. This simplifies aggregation math.
- **Soft delete only** — records are never permanently removed. This preserves audit history and is standard in financial systems.
- **Role assignment at registration** — any role can be assigned on register for demo purposes. In production this would be admin-only.
- **Single JWT secret** — symmetric signing. For production, asymmetric keys (RS256) would be preferable.
- **No refresh tokens** — tokens expire after `JWT_EXPIRES_IN`. Acceptable for an assessment; production would need refresh token rotation.
- **MongoDB Atlas free tier** — M0 has connection limits and no dedicated resources. Sufficient for assessment and demo use.

---

## Project Structure

```
finance-dashboard-platform/
├── api/index.js                    ← Vercel entry point
├── vercel.json                     ← Vercel config
├── src/
│   ├── app.js                      ← Express app
│   ├── server.js                   ← Local server bootstrap
│   ├── config/
│   │   ├── database.js
│   │   └── roles.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── recordController.js
│   │   └── userController.js
│   ├── docs/
│   │   └── openapi.spec.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiters.js
│   │   └── validate.js
│   ├── models/
│   │   ├── FinancialRecord.js
│   │   ├── User.js
│   │   ├── recordModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── records.js
│   │   └── users.js
│   ├── scripts/
│   │   ├── devWithMemoryMongo.js
│   │   ├── runApiTests.js
│   │   └── seedAdmin.js
│   └── services/
│       ├── authService.js
│       └── dashboardService.js
```
