const DashboardService = require("../services/dashboardService");

const DashboardController = {
  async summary(req, res, next) {
    try {
      const data = await DashboardService.getSummary();
      return res.json({ success: true, summary: data });
    } catch (e) {
      return next(e);
    }
  },

  async categoryTotals(req, res, next) {
    try {
      const data = await DashboardService.getCategoryTotals();
      const normalized = data.map((r) => ({
        ...r,
        total: Number(r.total),
        count: Number(r.count),
      }));
      return res.json({ success: true, categories: normalized });
    } catch (e) {
      return next(e);
    }
  },

  async monthlyTrends(req, res, next) {
    try {
      const months = Number(req.query.months) || 6;
      const data = await DashboardService.getMonthlyTrends({ months });
      const normalized = data.map((r) => ({
        ...r,
        income: Number(r.income),
        expenses: Number(r.expenses),
        net: Number(r.net),
      }));
      return res.json({ success: true, trends: normalized });
    } catch (e) {
      return next(e);
    }
  },

  async weeklyTrends(req, res, next) {
    try {
      const data = await DashboardService.getWeeklyTrends();
      const normalized = data.map((r) => ({
        ...r,
        income: Number(r.income),
        expenses: Number(r.expenses),
      }));
      return res.json({ success: true, trends: normalized });
    } catch (e) {
      return next(e);
    }
  },

  async recentActivity(req, res, next) {
    try {
      const limit = Number(req.query.limit) || 10;
      const data = await DashboardService.getRecentActivity({ limit });
      return res.json({ success: true, activity: data });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = DashboardController;
