import { computeAnalyticsSummary } from "../services/analyticsService.js";
import { calculateFinanceMetrics } from "../services/financeAnalyzer.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

export const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await computeAnalyticsSummary(req.userId);
    res.status(200).json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardMetrics = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).lean();
    const budget = await Budget.findOne({ userId: req.userId }).lean();
    
    const metrics = calculateFinanceMetrics(transactions, budget);
    
    res.status(200).json({ success: true, ...metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
