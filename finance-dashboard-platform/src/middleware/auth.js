const jwt = require("jsonwebtoken");
const { db } = require("../config/database");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db("users")
      .select("id", "name", "email", "role", "status")
      .where({ id: payload.id })
      .first();

    if (!user) return res.status(401).json({ success: false, error: "User not found" });
    if (user.status === "inactive") {
      return res.status(403).json({ success: false, error: "Account is inactive" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    return next();
  };
}

module.exports = { authenticate, requireRoles };
