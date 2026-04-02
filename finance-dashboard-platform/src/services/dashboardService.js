const { db, isPostgres } = require("../config/database");

const DashboardService = {
  async getSummary() {
    const rows = await db("financial_records")
      .whereNull("deleted_at")
      .select(
        db.raw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income"),
        db.raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses"),
        db.raw("SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance"),
        db.raw("COUNT(*) as total_records")
      );
    const row = rows[0];
    return {
      total_income: Number(row.total_income || 0),
      total_expenses: Number(row.total_expenses || 0),
      net_balance: Number(row.net_balance || 0),
      total_records: Number(row.total_records || 0),
    };
  },

  getCategoryTotals() {
    return db("financial_records")
      .whereNull("deleted_at")
      .select("category", "type")
      .sum("amount as total")
      .count("* as count")
      .groupBy("category", "type")
      .orderBy("total", "desc");
  },

  async getMonthlyTrends({ months = 6 } = {}) {
    const m = Math.min(Math.max(Number(months) || 6, 1), 24);
    if (isPostgres()) {
      return db("financial_records")
        .whereNull("deleted_at")
        .whereRaw("date::timestamp >= NOW() - (? * interval '1 month')", [m])
        .select(
          db.raw("to_char(date::timestamp, 'YYYY-MM') as month"),
          db.raw("SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) as income"),
          db.raw("SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) as expenses"),
          db.raw(
            "SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE -amount::numeric END) as net"
          )
        )
        .groupByRaw("to_char(date::timestamp, 'YYYY-MM')")
        .orderBy("month", "asc");
    }

    return db("financial_records")
      .whereNull("deleted_at")
      .whereRaw(`date >= date('now', '-' || ? || ' months')`, [m])
      .select(
        db.raw("strftime('%Y-%m', date) as month"),
        db.raw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income"),
        db.raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses"),
        db.raw("SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net")
      )
      .groupByRaw("strftime('%Y-%m', date)")
      .orderBy("month", "asc");
  },

  async getWeeklyTrends() {
    if (isPostgres()) {
      return db("financial_records")
        .whereNull("deleted_at")
        .whereRaw("date::timestamp >= NOW() - interval '8 weeks'")
        .select(
          db.raw("date_trunc('week', date::timestamp)::date as week"),
          db.raw("SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) as income"),
          db.raw("SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) as expenses")
        )
        .groupByRaw("date_trunc('week', date::timestamp)")
        .orderBy("week", "asc");
    }

    return db("financial_records")
      .whereNull("deleted_at")
      .whereRaw("date >= date('now', '-8 weeks')")
      .select(
        db.raw("strftime('%Y-W%W', date) as week"),
        db.raw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income"),
        db.raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses")
      )
      .groupByRaw("strftime('%Y-W%W', date)")
      .orderBy("week", "asc");
  },

  getRecentActivity({ limit = 10 } = {}) {
    return db("financial_records as r")
      .join("users as u", "r.created_by", "u.id")
      .whereNull("r.deleted_at")
      .select("r.id", "r.amount", "r.type", "r.category", "r.date", "r.notes", "u.name as created_by")
      .orderBy("r.created_at", "desc")
      .limit(limit);
  },
};

module.exports = DashboardService;
