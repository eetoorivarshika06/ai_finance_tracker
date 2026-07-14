import { computeAnalyticsSummary } from "../services/analyticsService.js";

export const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await computeAnalyticsSummary(req.userId);
    res.status(200).json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
