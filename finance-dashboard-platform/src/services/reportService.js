const { FinancialRecord } = require("../models/FinancialRecord");
const { clamp, monthsAgo, daysAgo } = require("../utils/dateHelpers");

/**
 * ReportService — advanced aggregations beyond the basic dashboard.
 * Produces structured data suitable for charts, exports, and summaries.
 */
const ReportService = {
  /**
   * Full financial summary for a given date range.
   * If no range given, uses all-time data.
   */
  async summaryByRange({ startDate, endDate } = {}) {
    const match = { deletedAt: null };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const [row] = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total_income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          total_expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          total_records: { $sum: 1 },
          avg_income: { $avg: { $cond: [{ $eq: ["$type", "income"] }, "$amount", null] } },
          avg_expense: { $avg: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", null] } },
          max_income: { $max: { $cond: [{ $eq: ["$type", "income"] }, "$amount", null] } },
          max_expense: { $max: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", null] } },
        },
      },
    ]);

    const r = row || {};
    const total_income = Number(r.total_income || 0);
    const total_expenses = Number(r.total_expenses || 0);

    return {
      total_income,
      total_expenses,
      net_balance: total_income - total_expenses,
      total_records: Number(r.total_records || 0),
      avg_income: Number((r.avg_income || 0).toFixed(2)),
      avg_expense: Number((r.avg_expense || 0).toFixed(2)),
      max_income: Number(r.max_income || 0),
      max_expense: Number(r.max_expense || 0),
      savings_rate:
        total_income > 0
          ? Number(((total_income - total_expenses) / total_income * 100).toFixed(2))
          : 0,
    };
  },

  /**
   * Top N categories by total amount for a given type.
   */
  async topCategories({ type, limit = 5, months = 3 } = {}) {
    const since = monthsAgo(clamp(months, 1, 24));
    const match = { deletedAt: null, date: { $gte: since } };
    if (type) match.type = type;

    return FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avg: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: clamp(limit, 1, 50) },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: { $round: ["$total", 2] },
          count: 1,
          avg: { $round: ["$avg", 2] },
        },
      },
    ]);
  },

  /**
   * Daily breakdown for the last N days.
   */
  async dailyBreakdown({ days = 30 } = {}) {
    const since = daysAgo(clamp(days, 1, 365));

    return FinancialRecord.aggregate([
      { $match: { deletedAt: null, date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          income: { $round: ["$income", 2] },
          expenses: { $round: ["$expenses", 2] },
          net: { $round: [{ $subtract: ["$income", "$expenses"] }, 2] },
          count: 1,
        },
      },
    ]);
  },

  /**
   * Year-over-year comparison for current vs previous year.
   */
  async yearOverYear() {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    const results = await FinancialRecord.aggregate([
      {
        $match: {
          deletedAt: null,
          date: { $gte: new Date(`${prevYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Reshape into { month, currentYear: { income, expense }, prevYear: { income, expense } }
    const map = {};
    for (const r of results) {
      const key = String(r._id.month).padStart(2, "0");
      if (!map[key]) map[key] = { month: key, [currentYear]: { income: 0, expense: 0 }, [prevYear]: { income: 0, expense: 0 } };
      map[key][r._id.year][r._id.type] = Number(r.total.toFixed(2));
    }

    return Object.values(map).map((m) => ({
      month: m.month,
      current_year: { year: currentYear, ...m[currentYear] },
      prev_year: { year: prevYear, ...m[prevYear] },
    }));
  },

  /**
   * Cash flow statement — net per month for the last N months.
   */
  async cashFlow({ months = 12 } = {}) {
    const since = monthsAgo(clamp(months, 1, 24));

    const rows = await FinancialRecord.aggregate([
      { $match: { deletedAt: null, date: { $gte: since } } },
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
          income: { $round: ["$income", 2] },
          expenses: { $round: ["$expenses", 2] },
          net: { $round: [{ $subtract: ["$income", "$expenses"] }, 2] },
        },
      },
    ]);

    // Compute running balance
    let running = 0;
    return rows.map((r) => {
      running = Number((running + r.net).toFixed(2));
      return { ...r, running_balance: running };
    });
  },
};

module.exports = ReportService;
