import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import {
  calculateBudgetVariance,
  calculateBurnRate,
  calculateDiscretionaryRatio,
  calculateSavingsRate,
  calculateSpendingVolatility,
  summarizeTransactions,
} from "../services/financeAnalyzer.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ transactionDate: -1 });
    const budget = await Budget.findOne({ userId: req.userId });

    const summary = summarizeTransactions(transactions, budget);

    const recentTransactions = transactions.slice(0, 5);

    res.status(200).json({
      success: true,
      ...summary,
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ transactionDate: -1 });
    const budgetDoc = await Budget.findOne({ userId: req.userId });
    const budgets = (budgetDoc?.categoryBudgets || []).map(budget => ({
      ...budget,
      category: budget.category,
      limit: budget.limit || budget.monthlyLimit || 0,
    }));

    const savingsRate = calculateSavingsRate(transactions);
    const burnRate = calculateBurnRate(transactions);
    const discretionaryRatio = calculateDiscretionaryRatio(transactions);
    const spendingVolatility = calculateSpendingVolatility(transactions);
    const budgetVariance = calculateBudgetVariance(transactions, budgets);

    res.status(200).json({
      success: true,
      savingsRate,
      burnRate,
      discretionaryRatio,
      spendingVolatility,
      budgetVariance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};