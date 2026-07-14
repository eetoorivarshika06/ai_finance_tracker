import express from "express";
import { getAnalyticsSummary } from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getAnalyticsSummary);

export default router;
