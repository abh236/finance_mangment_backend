const UserModel = require("../models/userModel");
const AuditService = require("../services/auditService");
const { AUDIT_ACTIONS } = require("../constants");
const { ok, fail } = require("../utils/responseFormatter");
const { parsePagination } = require("../utils/paginate");

const UserController = {
  async list(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await UserModel.list({ page, limit });
      return ok(res, result);
    } catch (e) {
      return next(e);
    }
  },

  async getOne(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return fail(res, 404, "User not found");
      return ok(res, { user });
    } catch (e) {
      return next(e);
    }
  },

  async update(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return fail(res, 404, "User not found");

      if (req.user.id === req.params.id && req.body.status === "inactive") {
        return fail(res, 400, "Cannot deactivate your own account");
      }

      const updated = await UserModel.update(req.params.id, req.body);

      const action =
        req.body.status === "inactive"
          ? AUDIT_ACTIONS.USER_DEACTIVATED
          : AUDIT_ACTIONS.USER_UPDATED;

      await AuditService.log({
        action,
        performedBy: req.user.id,
        targetType: "User",
        targetId: req.params.id,
        metadata: { changes: req.body },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return ok(res, { message: "User updated", user: updated });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = UserController;
