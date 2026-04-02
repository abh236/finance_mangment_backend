const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["viewer", "analyst", "admin"], default: "viewer" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

function toPublicUser(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  o.id = String(o._id);
  delete o._id;
  delete o.__v;
  delete o.password;
  if (o.createdAt) o.created_at = o.createdAt;
  if (o.updatedAt) o.updated_at = o.updatedAt;
  return o;
}

const User = mongoose.model("User", userSchema);

module.exports = { User, toPublicUser };
