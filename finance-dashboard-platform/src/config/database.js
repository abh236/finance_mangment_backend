const knex = require("knex");
const path = require("path");
const fs = require("fs");

const config = require("../../knexfile");

const env = process.env.NODE_ENV || "development";
const knexConfig = config[env] || config.development;

if (knexConfig.client === "sqlite3") {
  const file =
    typeof knexConfig.connection === "object" && knexConfig.connection.filename
      ? knexConfig.connection.filename
      : path.join(__dirname, "..", "..", "data", "finance.db");
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const db = knex(knexConfig);

let migrated = false;

async function runMigrationsIfNeeded() {
  if (migrated) return;
  if (process.env.SKIP_DB_MIGRATE === "true") {
    migrated = true;
    return;
  }
  await db.migrate.latest();
  migrated = true;
}

function isPostgres() {
  return db.client.config.client === "pg";
}

module.exports = { db, runMigrationsIfNeeded, isPostgres };
