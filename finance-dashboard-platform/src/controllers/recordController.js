const RecordModel = require("../models/recordModel");
const AuditService = require("../services/auditService");
const { AUDIT_ACTIONS } = require("../constants");
const { ok, created, fail } = require("../utils/responseFormatter");
const { parsePagination } = require("../utils/paginate");

const RecordController = {
  async create(req, res, next) {
    try {
      const record = await RecordModel.create({ ...req.body, created_by: req.user.id });

      await AuditService.log({
        action: AUDIT_ACTIONS.RECORD_CREATED,
        performedBy: req.user.id,
        targetType: "FinancialRecord",
        targetId: record.id,
        metadata: { amount: record.amount, type: record.type, category: record.category },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return created(res, { message: "Record created", record });
    } catch (e) {
      return next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { type, category, startDate, endDate, q } = req.query;

      const result = await RecordModel.list({ type, category, startDate, endDate, q, page, limit });
      return ok(res, result);
    } catch (e) {
      return next(e);
    }
  },

  async getOne(req, res, next) {
    try {
      const record = await RecordModel.findById(req.params.id);
      if (!record) return fail(res, 404, "Record not found");
      return ok(res, { record });
    } catch (e) {
      return next(e);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await RecordModel.findById(req.params.id);
      if (!existing) return fail(res, 404, "Record not found");

      const record = await RecordModel.update(req.params.id, req.body);

      await AuditService.log({
        action: AUDIT_ACTIONS.RECORD_UPDATED,
        performedBy: req.user.id,
        targetType: "FinancialRecord",
        targetId: req.params.id,
        metadata: { changes: req.body },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return ok(res, { message: "Record updated", record });
    } catch (e) {
      return next(e);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await RecordModel.findById(req.params.id);
      if (!existing) return fail(res, 404, "Record not found");

      await RecordModel.softDelete(req.params.id);

      await AuditService.log({
        action: AUDIT_ACTIONS.RECORD_DELETED,
        performedBy: req.user.id,
        targetType: "FinancialRecord",
        targetId: req.params.id,
        metadata: { category: existing.category, amount: existing.amount },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return ok(res, { message: "Record deleted" });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = RecordController;
