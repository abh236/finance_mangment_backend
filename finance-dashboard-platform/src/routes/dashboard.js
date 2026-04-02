const router = require("express").Router();
const { query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, requireRoles } = require("../middleware/auth");
const DashboardController = require("../controllers/dashboardController");

/** Dashboard & insights: viewer sees aggregates only; analysts/admins use the same endpoints. */
router.use(authenticate, requireRoles("viewer", "analyst", "admin"));

router.get("/summary", DashboardController.summary);
router.get("/categories", DashboardController.categoryTotals);

router.get(
  "/trends/monthly",
  query("months").optional().isInt({ min: 1, max: 24 }).withMessage("Months must be between 1 and 24"),
  validate,
  DashboardController.monthlyTrends
);

router.get("/trends/weekly", DashboardController.weeklyTrends);

router.get(
  "/activity",
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  validate,
  DashboardController.recentActivity
);

module.exports = router;
