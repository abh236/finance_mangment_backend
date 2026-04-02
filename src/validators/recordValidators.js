const { z } = require("zod");

const recordBody = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(2).max(50),
  date: z.string().datetime(),
  notes: z.string().max(200).optional().default(""),
});

const createRecordSchema = z.object({
  body: recordBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateRecordSchema = z.object({
  body: recordBody.partial(),
  params: z.object({
    recordId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

const listRecordsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(2).max(50).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
  }),
});

const recordIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    recordId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
  recordIdParamSchema,
};
