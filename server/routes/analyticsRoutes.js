import express from "express";
import { getAnalyticsSummary, getDashboardMetrics } from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getAnalyticsSummary);
router.get("/metrics", protect, getDashboardMetrics);

export default router;
