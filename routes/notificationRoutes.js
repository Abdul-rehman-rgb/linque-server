import express from "express";
import { getUserNotifications } from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/notifications", authMiddleware, getUserNotifications);

export default router;
