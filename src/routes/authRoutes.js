const express = require("express");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/authValidators");
const { registerUser, loginUser } = require("../services/userService");

const router = express.Router();

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const user = await registerUser(req.validated.body);
    return res.status(201).json({ message: "User created", user });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await loginUser(req.validated.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
