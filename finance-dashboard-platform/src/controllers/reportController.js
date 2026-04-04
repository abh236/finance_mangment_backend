const ReportService = require("../services/reportService");
const AuditService = require("../services/auditService");
const { AUDIT_ACTIONS } = require("../constants");
const { ok } = require("../utils/responseFormatter");
const { clamp } = require("../utils/dateHelpers");

const ReportController = {
  async summary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportService.summaryByRange({ startDate, endDate });

      await AuditService.log({
        action: AUDIT_ACTIONS.REPORT_GENERATED,
        performedBy: req.user.id,
        targetType: "System",
        metadata: { report: "summary", startDate, endDate },
        ipAddress: req.ip,
      });

      return ok(res, { report: data });
    } catch (e) {
      return next(e);
    }
  },

  async topCategories(req, res, next) {
    try {
      const { type, months, limit } = req.query;
      const data = await ReportService.topCategories({
        type,
        months: clamp(Number(months) || 3, 1, 24),
        limit: clamp(Number(limit) || 5, 1, 50),
      });
      return ok(res, { categories: data });
    } catch (e) {
      return next(e);
    }
  },

  async daily(req, res, next) {
    try {
      const days = clamp(Number(req.query.days) || 30, 1, 365);
      const data = await ReportService.dailyBreakdown({ days });
      return ok(res, { breakdown: data });
    } catch (e) {
      return next(e);
    }
  },

  async yearOverYear(req, res, next) {
    try {
      const data = await ReportService.yearOverYear();
      return ok(res, { comparison: data });
    } catch (e) {
      return next(e);
    }
  },

  async cashFlow(req, res, next) {
    try {
      const months = clamp(Number(req.query.months) || 12, 1, 24);
      const data = await ReportService.cashFlow({ months });
      return ok(res, { cash_flow: data });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = ReportController;
