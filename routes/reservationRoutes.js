import express from "express";
import { createReservation, getVendorReservations, updateReservationStatus } from "../controllers/reservationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/reservations", authMiddleware, createReservation);
router.get("/reservations", authMiddleware, getVendorReservations);
router.put("/reservations/:id", authMiddleware, updateReservationStatus);

export default router;
