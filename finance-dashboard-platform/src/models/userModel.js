const mongoose = require("mongoose");
const { User, toPublicUser } = require("./User");

const UserModel = {
  findByEmail: (email) => User.findOne({ email: email.toLowerCase() }).select("+password"),

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await User.findById(id).lean();
    return doc ? toPublicUser(doc) : null;
  },

  async create({ name, email, password, role = "viewer" }) {
    const doc = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      status: "active",
    });
    return this.findById(doc._id);
  },

  async update(id, fields) {
    if (!mongoose.isValidObjectId(id)) return null;
    const allowed = ["name", "role", "status"];
    const data = {};
    allowed.forEach((k) => {
      if (fields[k] !== undefined) data[k] = fields[k];
    });
    if (!Object.keys(data).length) return null;
    await User.findByIdAndUpdate(id, { $set: data });
    return this.findById(id);
  },

  async list({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);
    return {
      rows: rows.map((r) => toPublicUser(r)),
      total,
      page,
      limit,
    };
  },
};

module.exports = UserModel;
