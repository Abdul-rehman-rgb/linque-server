import express from "express";
import { createSlot, updateSlot } from "../controllers/slotController.js";
import vendorAuth from "../middleware/vendorAuth.js";

const router = express.Router();

router.post("/slots", vendorAuth, createSlot);
router.put("/slots/:id", vendorAuth, updateSlot);

export default router;
