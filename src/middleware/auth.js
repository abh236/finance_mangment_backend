const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { readDb } = require("../db/store");

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = payload.sub ?? payload.id;
    if (userId == null) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const db = await readDb();
    const user = db.users.find((u) => u.id === Number(userId));
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    req.user = {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authenticate;
