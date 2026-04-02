const { z } = require("zod");
const { ROLES } = require("../config/roles");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(128),
    role: z.enum([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]).default(ROLES.VIEWER),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
};
