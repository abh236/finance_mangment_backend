# Workspace Map

Full documentation is in the root [README.md](../README.md).

## Entry Points

| File | Purpose |
|------|---------|
| `finance-dashboard-platform/src/app.js` | Express app — routes, middleware, lazy DB connect |
| `finance-dashboard-platform/src/server.js` | Local HTTP server bootstrap |
| `finance-dashboard-platform/api/index.js` | Vercel serverless entry point |
| `finance-dashboard-platform/vercel.json` | Vercel deployment config |

## Scripts (from repo root)

| Command | What it does |
|---------|-------------|
| `npm run dev --prefix finance-dashboard-platform` | Start with nodemon |
| `npm run dev:memory --prefix finance-dashboard-platform` | Start with in-memory MongoDB |
| `npm run seed --prefix finance-dashboard-platform` | Seed admin@example.com / admin123 |
| `npm test --prefix finance-dashboard-platform` | Run 20-scenario integration tests |

## Config Files

| File | Purpose |
|------|---------|
| `.gitignore` | Covers entire repo |
| `.env.example` | Root env template (unused — see below) |
| `env.platform.example` | Copy to `finance-dashboard-platform/.env` |
| `finance-dashboard-platform/.env` | Live config (not committed) |
