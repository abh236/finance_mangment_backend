const { FinancialRecord } = require("../models/FinancialRecord");

const matchActive = { deletedAt: null };

const DashboardService = {
  async getSummary() {
    const [row] = await FinancialRecord.aggregate([
      { $match: matchActive },
      {
        $group: {
          _id: null,
          total_income: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          total_expenses: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
          net_balance: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", { $multiply: ["$amount", -1] }],
            },
          },
          total_records: { $sum: 1 },
        },
      },
    ]);

    const r = row || {};
    return {
      total_income: Number(r.total_income || 0),
      total_expenses: Number(r.total_expenses || 0),
      net_balance: Number(r.net_balance || 0),
      total_records: Number(r.total_records || 0),
    };
  },

  async getCategoryTotals() {
    return FinancialRecord.aggregate([
      { $match: matchActive },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: "$_id.category",
          type: "$_id.type",
          total: 1,
          count: 1,
        },
      },
    ]);
  },

  async getMonthlyTrends({ months = 6 } = {}) {
    const m = Math.min(Math.max(Number(months) || 6, 1), 24);
    const since = new Date();
    since.setMonth(since.getMonth() - m);

    return FinancialRecord.aggregate([
      { $match: { ...matchActive, date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          income: 1,
          expenses: 1,
          net: { $subtract: ["$income", "$expenses"] },
        },
      },
    ]);
  },

  async getWeeklyTrends() {
    const since = new Date();
    since.setDate(since.getDate() - 56);

    return FinancialRecord.aggregate([
      { $match: { ...matchActive, date: { $gte: since } } },
      {
        $group: {
          _id: {
            y: { $isoWeekYear: "$date" },
            w: { $isoWeek: "$date" },
          },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          week: {
            $concat: [{ $toString: "$_id.y" }, "-W", { $toString: "$_id.w" }],
          },
          income: 1,
          expenses: 1,
        },
      },
      { $sort: { week: 1 } },
    ]);
  },

  async getRecentActivity({ limit = 10 } = {}) {
    const docs = await FinancialRecord.find(matchActive)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("createdBy", "name")
      .lean();

    return docs.map((r) => ({
      id: String(r._id),
      amount: r.amount,
      type: r.type,
      category: r.category,
      date: r.date instanceof Date ? r.date.toISOString() : r.date,
      notes: r.notes,
      created_by: r.createdBy?.name || "Unknown",
    }));
  },
};

module.exports = DashboardService;
