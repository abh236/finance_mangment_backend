const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, requireRoles } = require("../middleware/auth");
const RecordController = require("../controllers/recordController");

router.use(authenticate);

router.get(
  "/",
  requireRoles("analyst", "admin"),
  [
    query("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    query("category").optional().isString().isLength({ max: 120 }).withMessage("Invalid category"),
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),
    query("q").optional().isString().isLength({ max: 120 }).withMessage("Search query too long"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  ],
  validate,
  RecordController.list
);

router.get(
  "/:id",
  requireRoles("analyst", "admin"),
  param("id").isInt({ min: 1 }).withMessage("Invalid record ID"),
  validate,
  RecordController.getOne
);

router.post(
  "/",
  requireRoles("admin"),
  [
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
    body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("date").isISO8601().withMessage("Date must be a valid ISO date"),
    body("notes").optional().trim(),
  ],
  validate,
  RecordController.create
);

router.patch(
  "/:id",
  requireRoles("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid record ID"),
    body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
    body("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
    body("date").optional().isISO8601().withMessage("Date must be a valid ISO date"),
    body("notes").optional().trim(),
  ],
  validate,
  RecordController.update
);

router.delete(
  "/:id",
  requireRoles("admin"),
  param("id").isInt({ min: 1 }).withMessage("Invalid record ID"),
  validate,
  RecordController.delete
);

module.exports = router;
