const { z } = require("zod");
const { ROLES } = require("../config/roles");

const updateUserSchema = z.object({
  body: z.object({
    role: z.enum([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    userId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  updateUserSchema,
};
