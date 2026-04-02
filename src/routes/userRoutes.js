const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { updateUserSchema } = require("../validators/userValidators");
const { listUsers, updateUser } = require("../services/userService");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["users:manage"]));

router.get("/", async (_req, res, next) => {
  try {
    const users = await listUsers();
    return res.status(200).json({ data: users });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:userId", validate(updateUserSchema), async (req, res, next) => {
  try {
    const { userId } = req.validated.params;
    const user = await updateUser(userId, req.validated.body);
    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
