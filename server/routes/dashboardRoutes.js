import express from "express";
import { getDashboardSummary, getMetrics } from "../controllers/dashboardController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);
router.get("/metrics", protect, getMetrics);

export default router;