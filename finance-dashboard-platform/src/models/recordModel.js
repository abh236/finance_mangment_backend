const { db } = require("../config/database");
const { insertedId } = require("../utils/insertId");

async function insertRecord(data) {
  if (db.client.config.client === "pg") {
    const row = await db("financial_records").insert(data).returning("id");
    return insertedId(row);
  }
  const result = await db("financial_records").insert(data);
  return insertedId(result);
}

const base = () =>
  db("financial_records as r")
    .join("users as u", "r.created_by", "u.id")
    .whereNull("r.deleted_at")
    .select(
      "r.id",
      "r.amount",
      "r.type",
      "r.category",
      "r.date",
      "r.notes",
      "r.created_by",
      "r.created_at",
      "r.updated_at",
      "u.name as created_by_name"
    );

const RecordModel = {
  async create({ amount, type, category, date, notes, created_by }) {
    const id = await insertRecord({
      amount,
      type,
      category,
      date,
      notes: notes || null,
      created_by,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
    return this.findById(id);
  },

  findById: (id) => base().where("r.id", id).first(),

  async list({ type, category, startDate, endDate, q, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let query = base();

    if (type) query = query.where("r.type", type);
    if (category) query = query.where("r.category", category);
    if (startDate) query = query.where("r.date", ">=", startDate);
    if (endDate) query = query.where("r.date", "<=", endDate);
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      if (db.client.config.client === "pg") {
        query = query.where(function () {
          this.where("r.category", "ilike", term).orWhere("r.notes", "ilike", term);
        });
      } else {
        query = query.where(function () {
          this.where("r.category", "like", term).orWhere("r.notes", "like", term);
        });
      }
    }

    const rows = await query.clone().orderBy("r.date", "desc").limit(limit).offset(offset);

    let cq = db("financial_records").whereNull("deleted_at");
    if (type) cq = cq.where("type", type);
    if (category) cq = cq.where("category", category);
    if (startDate) cq = cq.where("date", ">=", startDate);
    if (endDate) cq = cq.where("date", "<=", endDate);
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      if (db.client.config.client === "pg") {
        cq = cq.where(function () {
          this.where("category", "ilike", term).orWhere("notes", "ilike", term);
        });
      } else {
        cq = cq.where(function () {
          this.where("category", "like", term).orWhere("notes", "like", term);
        });
      }
    }
    const [{ total }] = await cq.count({ total: "*" });

    return { rows, total: Number(total), page, limit };
  },

  async update(id, fields) {
    const allowed = ["amount", "type", "category", "date", "notes"];
    const data = {};
    allowed.forEach((k) => {
      if (fields[k] !== undefined) data[k] = fields[k];
    });
    if (!Object.keys(data).length) return null;
    data.updated_at = db.fn.now();
    await db("financial_records").where({ id }).whereNull("deleted_at").update(data);
    return this.findById(id);
  },

  softDelete: (id) =>
    db("financial_records").where({ id }).whereNull("deleted_at").update({ deleted_at: db.fn.now() }),
};

module.exports = RecordModel;
