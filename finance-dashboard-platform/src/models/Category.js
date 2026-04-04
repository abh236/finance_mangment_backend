const mongoose = require("mongoose");

/**
 * Category — predefined labels for financial records.
 * Admins manage categories; all roles can read them.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    type: {
      type: String,
      enum: ["income", "expense", "both"],
      default: "both",
    },
    description: {
      type: String,
      default: "",
      maxlength: 300,
    },
    color: {
      type: String,
      default: "#6366f1", // indigo — for UI badge rendering
      match: /^#[0-9a-fA-F]{6}$/,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ type: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model("Category", categorySchema);

function formatCategory(doc) {
  if (!doc) return null;
  const c = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: String(c._id),
    name: c.name,
    type: c.type,
    description: c.description,
    color: c.color,
    isActive: c.isActive,
    created_by: c.createdBy ? String(c.createdBy._id || c.createdBy) : null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

module.exports = { Category, formatCategory };
