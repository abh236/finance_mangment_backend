/**
 * Schema merged from backend/finance-dashboard + indexes for scale.
 * Works with SQLite and PostgreSQL via Knex.
 */
exports.up = async function (knex) {
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.string("name", 255).notNullable();
    t.string("email", 255).notNullable().unique();
    t.string("password", 255).notNullable();
    t.string("role", 32).notNullable().defaultTo("viewer"); // viewer | analyst | admin
    t.string("status", 32).notNullable().defaultTo("active"); // active | inactive
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });
  await knex.schema.raw("CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)");

  await knex.schema.createTable("financial_records", (t) => {
    t.increments("id").primary();
    t.decimal("amount", 14, 2).notNullable();
    t.string("type", 16).notNullable(); // income | expense
    t.string("category", 120).notNullable();
    t.string("date", 32).notNullable(); // ISO date string for portability
    t.text("notes").nullable();
    t.integer("created_by").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.timestamp("deleted_at").nullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS financial_records_deleted_at_idx ON financial_records (deleted_at)"
  );
  await knex.schema.raw("CREATE INDEX IF NOT EXISTS financial_records_date_idx ON financial_records (date)");
  await knex.schema.raw("CREATE INDEX IF NOT EXISTS financial_records_type_idx ON financial_records (type)");
  await knex.schema.raw("CREATE INDEX IF NOT EXISTS financial_records_category_idx ON financial_records (category)");
  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS financial_records_created_by_idx ON financial_records (created_by)"
  );
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("financial_records");
  await knex.schema.dropTableIfExists("users");
};
