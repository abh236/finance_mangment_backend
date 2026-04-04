const router = require("express").Router();
const { param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, requireRoles } = require("../middleware/auth");
const AuditController = require("../controllers/auditController");

// Audit logs are admin-only
router.use(authenticate, requireRoles("admin"));

router.get(
  "/",
  [
    query("action").optional().isString(),
    query("performedBy").optional().isMongoId().withMessage("Invalid user ID"),
    query("targetType")
      .optional()
      .isIn(["User", "FinancialRecord", "Category", "System"])
      .withMessage("Invalid targetType"),
    query("status").optional().isIn(["success", "failure"]),
    query("startDate").optional().isISO8601().withMessage("Invalid startDate"),
    query("endDate").optional().isISO8601().withMessage("Invalid endDate"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  AuditController.list
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid audit log ID"),
  validate,
  AuditController.getOne
);

module.exports = router;
