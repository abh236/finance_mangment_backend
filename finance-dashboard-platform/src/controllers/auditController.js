const AuditService = require("../services/auditService");
const { ok, fail } = require("../utils/responseFormatter");
const { parsePagination } = require("../utils/paginate");

const AuditController = {
  async list(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { action, performedBy, targetType, targetId, status, startDate, endDate } = req.query;

      const result = await AuditService.list({
        action,
        performedBy,
        targetType,
        targetId,
        status,
        startDate,
        endDate,
        page,
        limit,
      });

      return ok(res, result);
    } catch (e) {
      return next(e);
    }
  },

  async getOne(req, res, next) {
    try {
      const log = await AuditService.findById(req.params.id);
      if (!log) return fail(res, 404, "Audit log entry not found");
      return ok(res, { log });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = AuditController;
