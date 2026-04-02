const { readDb } = require("../db/store");

function groupByCategory(records) {
  const map = {};
  for (const record of records) {
    map[record.category] = (map[record.category] || 0) + record.amount;
  }
  return Object.entries(map).map(([category, total]) => ({ category, total }));
}

function groupByMonth(records) {
  const map = {};
  for (const record of records) {
    const month = new Date(record.date).toISOString().slice(0, 7);
    if (!map[month]) map[month] = { income: 0, expense: 0 };
    map[month][record.type] += record.amount;
  }

  return Object.entries(map)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, values]) => ({ month, ...values, net: values.income - values.expense }));
}

async function getSummary() {
  const db = await readDb();
  const records = db.records;

  const totalIncome = records.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const categoryTotals = groupByCategory(records);
  const recentActivity = records
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  const monthlyTrends = groupByMonth(records);

  return {
    totals: { totalIncome, totalExpenses, netBalance },
    categoryTotals,
    recentActivity,
    monthlyTrends,
  };
}

module.exports = {
  getSummary,
};
