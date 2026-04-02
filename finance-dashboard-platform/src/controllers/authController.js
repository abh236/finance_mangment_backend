const AuthService = require("../services/authService");

const AuthController = {
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);
      return res.status(201).json({ success: true, message: "User registered successfully", user });
    } catch (err) {
      return next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      return res.json({ success: true, ...result });
    } catch (err) {
      return next(err);
    }
  },

  me(req, res) {
    return res.json({ success: true, user: req.user });
  },
};

module.exports = AuthController;
