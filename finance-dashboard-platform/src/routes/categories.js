const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, requireRoles } = require("../middleware/auth");
const CategoryController = require("../controllers/categoryController");

router.use(authenticate);

// All roles can list and read categories
router.get(
  "/",
  [
    query("type").optional().isIn(["income", "expense", "both"]).withMessage("Invalid type"),
    query("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  CategoryController.list
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid category ID"),
  validate,
  CategoryController.getOne
);

// Admin only — create, update, delete
router.post(
  "/",
  requireRoles("admin"),
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 80 }),
    body("type").optional().isIn(["income", "expense", "both"]).withMessage("Invalid type"),
    body("description").optional().trim().isLength({ max: 300 }),
    body("color")
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage("Color must be a valid hex code e.g. #ff0000"),
  ],
  validate,
  CategoryController.create
);

router.patch(
  "/:id",
  requireRoles("admin"),
  [
    param("id").isMongoId().withMessage("Invalid category ID"),
    body("name").optional().trim().notEmpty().isLength({ max: 80 }),
    body("type").optional().isIn(["income", "expense", "both"]),
    body("description").optional().trim().isLength({ max: 300 }),
    body("color")
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage("Color must be a valid hex code"),
    body("isActive").optional().isBoolean(),
  ],
  validate,
  CategoryController.update
);

router.delete(
  "/:id",
  requireRoles("admin"),
  param("id").isMongoId().withMessage("Invalid category ID"),
  validate,
  CategoryController.delete
);

module.exports = router;
