const ROLES = {
  VIEWER: "viewer",
  ANALYST: "analyst",
  ADMIN: "admin",
};

/** Viewer: dashboard only. Analyst: + read records. Admin: full management. */
const ROLE_PERMISSIONS = {
  [ROLES.VIEWER]: ["dashboard:read"],
  [ROLES.ANALYST]: ["records:read", "dashboard:read", "insights:read"],
  [ROLES.ADMIN]: [
    "records:create",
    "records:read",
    "records:update",
    "records:delete",
    "dashboard:read",
    "users:manage",
  ],
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
};
