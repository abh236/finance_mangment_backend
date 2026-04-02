# Finance Dashboard Platform

This folder is the **main API** (MongoDB, Mongoose, Swagger, RBAC, dashboard aggregations).

**All setup, requirements, API tables, and troubleshooting are in the repository root:**

→ **[`../README.md`](../README.md)** (single source of truth)

Quick links:

- Workspace map: [`../docs/WORKSPACE.md`](../docs/WORKSPACE.md)
- Platform env template: copy **[`../env.platform.example`](../env.platform.example)** to **`finance-dashboard-platform/.env`** (must include **`MONGODB_URI`**)

From repo root:

```bash
npm run install:platform
# Start MongoDB (optional): cd finance-dashboard-platform && docker compose up -d
npm run dev:platform
```

Swagger UI (when running): `http://localhost:4000/api/docs` (or your `PORT`).
