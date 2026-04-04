const router = require("express").Router();
const { query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, requireRoles } = require("../middleware/auth");
const ReportController = require("../controllers/reportController");

// Reports: analyst and admin only
router.use(authenticate, requireRoles("analyst", "admin"));

router.get(
  "/summary",
  [
    query("startDate").optional().isISO8601().withMessage("Invalid startDate"),
    query("endDate").optional().isISO8601().withMessage("Invalid endDate"),
  ],
  validate,
  ReportController.summary
);

router.get(
  "/top-categories",
  [
    query("type").optional().isIn(["income", "expense"]),
    query("months").optional().isInt({ min: 1, max: 24 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  ReportController.topCategories
);

router.get(
  "/daily",
  [query("days").optional().isInt({ min: 1, max: 365 })],
  validate,
  ReportController.daily
);

router.get("/year-over-year", ReportController.yearOverYear);

router.get(
  "/cash-flow",
  [query("months").optional().isInt({ min: 1, max: 24 })],
  validate,
  ReportController.cashFlow
);

module.exports = router;
