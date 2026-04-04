const mongoose = require("mongoose");

/**
 * AuditLog — immutable record of every significant action in the system.
 * Written on user events, record mutations, and category changes.
 * Admins can query audit logs; no update or delete allowed.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system actions or failed logins
    },
    targetType: {
      type: String,
      enum: ["User", "FinancialRecord", "Category", "System"],
      required: true,
    },
    targetId: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
  },
  {
    timestamps: true,
    // Audit logs are never updated — enforce at schema level
    strict: true,
  }
);

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = { AuditLog };
