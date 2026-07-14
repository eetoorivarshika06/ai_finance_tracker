/**
 * analyticsService.js
 *
 * Computes finance analytics from MongoDB using aggregation pipelines.
 * Separate from aiController — read-only analytics for GET /api/analytics/summary.
 */

import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

const monthKey = (date) => new Date(date).toISOString().slice(0, 7);

export const computeAnalyticsSummary = async (userId) => {
  const transactions = await Transaction.find({ userId }).lean();
  const budget = await Budget.findOne({ userId }).lean();

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  // ── Savings rate trend (monthly) ──────────────────────────────────────────
  const monthlyFlows = {};
  for (const t of transactions) {
    const m = monthKey(t.transactionDate);
    if (!monthlyFlows[m]) monthlyFlows[m] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyFlows[m].income += t.amount;
    else monthlyFlows[m].expense += t.amount;
  }

  const savingsRateTrend = Object.entries(monthlyFlows)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income: inc, expense: exp }]) => ({
      month,
      income: Math.round(inc * 100) / 100,
      expenses: Math.round(exp * 100) / 100,
      savingsRate: inc > 0 ? Math.round(((inc - exp) / inc) * 10000) / 100 : null,
    }));

  // ── Budget variance by category (current month) ─────────────────────────────
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const categoryActuals = {};
  for (const t of expenses) {
    if (monthKey(t.transactionDate) === currentMonth) {
      categoryActuals[t.category] = (categoryActuals[t.category] || 0) + t.amount;
    }
  }

  const budgetVarianceByCategory = (budget?.categoryBudgets || []).map((cb) => {
    const actual = categoryActuals[cb.category] || 0;
    const budgeted = cb.limit || 0;
    const variancePct =
      budgeted > 0 ? Math.round(((actual - budgeted) / budgeted) * 10000) / 100 : null;
    return {
      category: cb.category,
      actual: Math.round(actual * 100) / 100,
      budgeted,
      variancePct,
    };
  });

  // ── Top 3 anomalies (>2σ from category mean) ──────────────────────────────
  const catStats = {};
  for (const t of expenses) {
    if (!catStats[t.category]) catStats[t.category] = { amounts: [] };
    catStats[t.category].amounts.push(t.amount);
  }

  for (const cat of Object.keys(catStats)) {
    const amounts = catStats[cat].amounts;
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, v) => sum + (v - mean) ** 2, 0) / amounts.length;
    catStats[cat].mean = mean;
    catStats[cat].std = Math.sqrt(variance);
  }

  const anomalies = expenses
    .map((t) => {
      const stats = catStats[t.category];
      if (!stats || stats.std === 0) return null;
      const zScore = (t.amount - stats.mean) / stats.std;
      if (zScore <= 2) return null;
      return {
        id: t._id,
        date: t.transactionDate,
        category: t.category,
        title: t.title,
        amount: t.amount,
        zScore: Math.round(zScore * 100) / 100,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, 3);

  return {
    savingsRateTrend,
    budgetVarianceByCategory,
    topAnomalies: anomalies,
    generatedAt: new Date().toISOString(),
  };
};
