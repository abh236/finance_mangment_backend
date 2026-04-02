const RecordModel = require("../models/recordModel");

const RecordController = {
  async create(req, res, next) {
    try {
      const record = await RecordModel.create({ ...req.body, created_by: req.user.id });
      return res.status(201).json({ success: true, message: "Record created", record });
    } catch (e) {
      return next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { type, category, startDate, endDate, q, page = 1, limit = 20 } = req.query;
      const result = await RecordModel.list({
        type,
        category,
        startDate,
        endDate,
        q,
        page: Number(page),
        limit: Number(limit),
      });
      return res.json({ success: true, ...result });
    } catch (e) {
      return next(e);
    }
  },

  async getOne(req, res, next) {
    try {
      const record = await RecordModel.findById(req.params.id);
      if (!record) return res.status(404).json({ success: false, error: "Record not found" });
      return res.json({ success: true, record });
    } catch (e) {
      return next(e);
    }
  },

  async update(req, res, next) {
    try {
      const record = await RecordModel.findById(req.params.id);
      if (!record) return res.status(404).json({ success: false, error: "Record not found" });
      const updated = await RecordModel.update(req.params.id, req.body);
      return res.json({ success: true, message: "Record updated", record: updated });
    } catch (e) {
      return next(e);
    }
  },

  async delete(req, res, next) {
    try {
      const record = await RecordModel.findById(req.params.id);
      if (!record) return res.status(404).json({ success: false, error: "Record not found" });
      await RecordModel.softDelete(req.params.id);
      return res.json({ success: true, message: "Record deleted" });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = RecordController;
