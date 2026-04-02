/**
 * Assignment-aligned RBAC:
 * - viewer: dashboard / insights only (aggregates), no raw record listing
 * - analyst: viewer + read financial records
 * - admin: full record CRUD + user management
 */

const ROLES = {
  VIEWER: "viewer",
  ANALYST: "analyst",
  ADMIN: "admin",
};

const ROLE_LEVELS = {
  [ROLES.VIEWER]: 1,
  [ROLES.ANALYST]: 2,
  [ROLES.ADMIN]: 3,
};

module.exports = { ROLES, ROLE_LEVELS };
