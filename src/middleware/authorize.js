const { ROLE_PERMISSIONS } = require("../config/roles");

function authorize(requiredPermissions = []) {
  return (req, res, next) => {
    const role = req.user?.role;
    const userPermissions = ROLE_PERMISSIONS[role] || [];

    const allowed = requiredPermissions.every((perm) => userPermissions.includes(perm));
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    return next();
  };
}

module.exports = authorize;
