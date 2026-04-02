require("dotenv").config();

const path = require("path");

const migrations = {
  directory: path.join(__dirname, "src", "db", "migrations"),
};
const seeds = {
  directory: path.join(__dirname, "src", "db", "seeds"),
};

function pgConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return {
    connectionString: url,
    ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
}

/** @type { import('knex').Knex.Config } */
module.exports = {
  development: {
    client: process.env.DB_CLIENT === "pg" ? "pg" : "sqlite3",
    connection:
      process.env.DB_CLIENT === "pg"
        ? pgConnection() || { host: "127.0.0.1", user: "postgres", password: "postgres", database: "finance_dashboard" }
        : { filename: path.join(__dirname, "data", "finance.db") },
    useNullAsDefault: true,
    pool: process.env.DB_CLIENT === "pg" ? { min: 2, max: 20 } : { min: 1, max: 5 },
    migrations,
    seeds,
  },
  production: {
    client: "pg",
    connection: pgConnection(),
    pool: { min: 2, max: 30 },
    migrations,
    seeds,
  },
};
