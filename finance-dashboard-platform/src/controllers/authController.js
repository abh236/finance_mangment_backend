const AuthService = require("../services/authService");
const AuditService = require("../services/auditService");
const { AUDIT_ACTIONS } = require("../constants");
const { ok, created } = require("../utils/responseFormatter");

const AuthController = {
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);

      await AuditService.log({
        action: AUDIT_ACTIONS.USER_REGISTERED,
        performedBy: user.id,
        targetType: "User",
        targetId: user.id,
        metadata: { email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return created(res, { message: "User registered successfully", user });
    } catch (err) {
      return next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);

      await AuditService.log({
        action: AUDIT_ACTIONS.USER_LOGIN,
        performedBy: result.user.id,
        targetType: "User",
        targetId: result.user.id,
        metadata: { email: result.user.email },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return ok(res, result);
    } catch (err) {
      // Log failed login attempts too
      await AuditService.log({
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        targetType: "User",
        metadata: { email: req.body?.email, reason: err.message },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        status: "failure",
      });
      return next(err);
    }
  },

  me(req, res) {
    return ok(res, { user: req.user });
  },
};

module.exports = AuthController;
