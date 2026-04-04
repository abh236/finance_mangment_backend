const mongoose = require("mongoose");
const { Category, formatCategory } = require("../models/Category");
const HttpError = require("../utils/httpError");
const { parsePagination, paginatedResponse } = require("../utils/paginate");

const CategoryService = {
  async create({ name, type, description, color, createdBy }) {
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) throw new HttpError(409, `Category "${name}" already exists`);

    const doc = await Category.create({
      name: name.trim(),
      type: type || "both",
      description: description || "",
      color: color || "#6366f1",
      createdBy,
    });
    return formatCategory(doc);
  },

  async list({ type, isActive, page, limit } = {}) {
    const filter = {};
    if (type) filter.type = { $in: [type, "both"] };
    if (isActive !== undefined) filter.isActive = isActive === "true" || isActive === true;

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    return paginatedResponse(rows.map(formatCategory), total, page, limit);
  },

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await Category.findById(id).lean();
    return formatCategory(doc);
  },

  async findByName(name) {
    const doc = await Category.findOne({ name: name.trim() }).lean();
    return formatCategory(doc);
  },

  async update(id, { name, type, description, color, isActive }) {
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid category ID");

    const existing = await Category.findById(id);
    if (!existing) throw new HttpError(404, "Category not found");

    // Check name uniqueness if changing name
    if (name && name.trim() !== existing.name) {
      const conflict = await Category.findOne({ name: name.trim() });
      if (conflict) throw new HttpError(409, `Category "${name}" already exists`);
    }

    const allowed = { name, type, description, color, isActive };
    const data = {};
    Object.entries(allowed).forEach(([k, v]) => {
      if (v !== undefined) data[k] = typeof v === "string" ? v.trim() : v;
    });

    const updated = await Category.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return formatCategory(updated);
  },

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid category ID");
    const doc = await Category.findByIdAndDelete(id).lean();
    if (!doc) throw new HttpError(404, "Category not found");
    return formatCategory(doc);
  },

  /**
   * Returns all active category names as a flat array — used for record validation.
   */
  async getActiveNames() {
    const docs = await Category.find({ isActive: true }).select("name").lean();
    return docs.map((d) => d.name);
  },
};

module.exports = CategoryService;
