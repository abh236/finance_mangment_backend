const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { getSummary } = require("../services/dashboardService");

const router = express.Router();

router.use(authenticate);
router.get("/summary", authorize(["dashboard:read"]), async (_req, res, next) => {
  try {
    const data = await getSummary();
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
