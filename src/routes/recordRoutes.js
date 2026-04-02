const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  createRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
  recordIdParamSchema,
} = require("../validators/recordValidators");
const {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../services/recordService");

const router = express.Router();

router.use(authenticate);

router.get("/", authorize(["records:read"]), validate(listRecordsSchema), async (req, res, next) => {
  try {
    const result = await listRecords(req.validated.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/:recordId", authorize(["records:read"]), validate(recordIdParamSchema), async (req, res, next) => {
  try {
    const record = await getRecordById(req.validated.params.recordId);
    return res.status(200).json({ data: record });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authorize(["records:create"]), validate(createRecordSchema), async (req, res, next) => {
  try {
    const record = await createRecord(req.validated.body, req.user.sub);
    return res.status(201).json({ message: "Record created", data: record });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:recordId", authorize(["records:update"]), validate(updateRecordSchema), async (req, res, next) => {
  try {
    const record = await updateRecord(req.validated.params.recordId, req.validated.body);
    return res.status(200).json({ message: "Record updated", data: record });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:recordId", authorize(["records:delete"]), validate(recordIdParamSchema), async (req, res, next) => {
  try {
    const record = await deleteRecord(req.validated.params.recordId);
    return res.status(200).json({ message: "Record deleted", data: record });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
