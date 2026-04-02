const router = require("express").Router();
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, requireRoles } = require("../middleware/auth");
const UserController = require("../controllers/userController");

router.use(authenticate, requireRoles("admin"));

router.get("/", UserController.list);

router.get("/:id", param("id").isInt({ min: 1 }).withMessage("Invalid user ID"), validate, UserController.getOne);

router.patch(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid user ID"),
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role"),
    body("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status"),
  ],
  validate,
  UserController.update
);

module.exports = router;
