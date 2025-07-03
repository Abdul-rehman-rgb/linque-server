import express from "express";
import { bookReservation } from "../controllers/reservationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/reservations", authMiddleware, bookReservation);

export default router;
