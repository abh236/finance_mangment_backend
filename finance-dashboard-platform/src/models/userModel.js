const { db } = require("../config/database");
const { insertedId } = require("../utils/insertId");

async function insertReturningId(table, data) {
  if (db.client.config.client === "pg") {
    const row = await db(table).insert(data).returning("id");
    return insertedId(row);
  }
  const result = await db(table).insert(data);
  return insertedId(result);
}

const UserModel = {
  findByEmail: (email) => db("users").where({ email }).first(),

  findById: (id) =>
    db("users").select("id", "name", "email", "role", "status", "created_at").where({ id }).first(),

  async create({ name, email, password, role = "viewer" }) {
    const id = await insertReturningId("users", {
      name,
      email,
      password,
      role,
      status: "active",
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
    return this.findById(id);
  },

  async update(id, fields) {
    const allowed = ["name", "role", "status"];
    const data = {};
    allowed.forEach((k) => {
      if (fields[k] !== undefined) data[k] = fields[k];
    });
    if (!Object.keys(data).length) return null;
    data.updated_at = db.fn.now();
    await db("users").where({ id }).update(data);
    return this.findById(id);
  },

  async list({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const rows = await db("users")
      .select("id", "name", "email", "role", "status", "created_at")
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);
    const [{ total }] = await db("users").count({ total: "*" });
    return { rows, total: Number(total), page, limit };
  },
};

module.exports = UserModel;
