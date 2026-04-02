const UserModel = require("../models/userModel");

const UserController = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await UserModel.list({ page: Number(page), limit: Number(limit) });
      return res.json({ success: true, ...result });
    } catch (e) {
      return next(e);
    }
  },

  async getOne(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user });
    } catch (e) {
      return next(e);
    }
  },

  async update(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      if (req.user.id === req.params.id && req.body.status === "inactive") {
        return res.status(400).json({ success: false, error: "Cannot deactivate your own account" });
      }

      const updated = await UserModel.update(req.params.id, req.body);
      return res.json({ success: true, message: "User updated", user: updated });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = UserController;
