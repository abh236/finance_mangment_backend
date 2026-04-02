const mongoose = require("mongoose");
const { FinancialRecord } = require("./FinancialRecord");

function formatRecord(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : { ...doc };
  const createdBy = r.createdBy;
  let created_by_name;
  let created_by;
  if (createdBy && typeof createdBy === "object" && createdBy.name) {
    created_by_name = createdBy.name;
    created_by = String(createdBy._id || createdBy);
  } else {
    created_by = String(createdBy);
  }
  return {
    id: String(r._id),
    amount: r.amount,
    type: r.type,
    category: r.category,
    date: r.date instanceof Date ? r.date.toISOString() : r.date,
    notes: r.notes || "",
    created_by,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    ...(created_by_name && { created_by_name }),
  };
}

const RecordModel = {
  async create({ amount, type, category, date, notes, created_by }) {
    const doc = await FinancialRecord.create({
      amount,
      type,
      category,
      date: new Date(date),
      notes: notes || "",
      createdBy: created_by,
    });
    return this.findById(doc._id);
  },

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await FinancialRecord.findOne({ _id: id, deletedAt: null }).populate("createdBy", "name");
    return formatRecord(doc);
  },

  async list({ type, category, startDate, endDate, q, page = 1, limit = 20 } = {}) {
    const filter = { deletedAt: null };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ category: rx }, { notes: rx }];
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      FinancialRecord.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name"),
      FinancialRecord.countDocuments(filter),
    ]);

    return { rows: docs.map(formatRecord), total, page, limit };
  },

  async update(id, fields) {
    if (!mongoose.isValidObjectId(id)) return null;
    const allowed = ["amount", "type", "category", "date", "notes"];
    const data = {};
    allowed.forEach((k) => {
      if (fields[k] !== undefined) data[k] = k === "date" ? new Date(fields[k]) : fields[k];
    });
    if (!Object.keys(data).length) return null;
    await FinancialRecord.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: data });
    return this.findById(id);
  },

  async softDelete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const existing = await FinancialRecord.findOne({ _id: id, deletedAt: null }).populate("createdBy", "name");
    if (!existing) return null;
    const snapshot = formatRecord(existing);
    existing.deletedAt = new Date();
    await existing.save();
    return snapshot;
  },
};

module.exports = RecordModel;
