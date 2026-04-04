const { AuditLog } = require("../models/AuditLog");
const { parsePagination, paginatedResponse } = require("../utils/paginate");

/**
 * AuditService — write and query audit log entries.
 * All writes are fire-and-forget (errors are swallowed to never break main flow).
 */
const AuditService = {
  /**
   * Record an audit event. Never throws — audit failures must not break requests.
   * @param {object} opts
   * @param {string} opts.action - AUDIT_ACTIONS constant
   * @param {string|null} opts.performedBy - User ObjectId string
   * @param {string} opts.targetType - "User" | "FinancialRecord" | "Category" | "System"
   * @param {string|null} opts.targetId
   * @param {object} opts.metadata - Extra context (diff, email, etc.)
   * @param {string|null} opts.ipAddress
   * @param {string|null} opts.userAgent
   * @param {"success"|"failure"} opts.status
   */
  async log({
    action,
    performedBy = null,
    targetType = "System",
    targetId = null,
    metadata = {},
    ipAddress = null,
    userAgent = null,
    status = "success",
  }) {
    try {
      await AuditLog.create({
        action,
        performedBy: performedBy || null,
        targetType,
        targetId: targetId ? String(targetId) : null,
        metadata,
        ipAddress,
        userAgent,
        status,
      });
    } catch (err) {
      // Audit failures must never crash the main request
      console.error("[AuditService] Failed to write audit log:", err.message);
    }
  },

  /**
   * List audit logs with filters and pagination (admin only).
   */
  async list({ action, performedBy, targetType, targetId, status, startDate, endDate, page, limit } = {}) {
    const filter = {};
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const { skip } = { skip: (page - 1) * limit };
    const [rows, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("performedBy", "name email role")
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const formatted = rows.map((r) => ({
      id: String(r._id),
      action: r.action,
      performed_by: r.performedBy
        ? { id: String(r.performedBy._id), name: r.performedBy.name, email: r.performedBy.email }
        : null,
      target_type: r.targetType,
      target_id: r.targetId,
      metadata: r.metadata,
      ip_address: r.ipAddress,
      status: r.status,
      created_at: r.createdAt,
    }));

    return paginatedResponse(formatted, total, page, limit);
  },

  /**
   * Get a single audit log entry by ID.
   */
  async findById(id) {
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(id)) return null;
    return AuditLog.findById(id).populate("performedBy", "name email role").lean();
  },
};

module.exports = AuditService;
