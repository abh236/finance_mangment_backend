/** Normalize Knex insert result across SQLite (numeric id) and PostgreSQL (.returning). */
function insertedId(rows) {
  const first = rows[0];
  if (first && typeof first === "object" && first.id != null) return Number(first.id);
  return Number(first);
}

module.exports = { insertedId };
