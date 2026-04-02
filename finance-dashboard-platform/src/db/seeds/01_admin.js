const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  const exists = await knex("users").where({ email: "admin@example.com" }).first();
  if (exists) return;

  const password = await bcrypt.hash("admin123", 10);
  await knex("users").insert({
    name: "Admin",
    email: "admin@example.com",
    password,
    role: "admin",
    status: "active",
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
};
