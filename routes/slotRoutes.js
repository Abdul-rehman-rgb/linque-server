import express from "express";
import { createSlot, updateSlot, listSlots, availabilities, layout, requestUpdate, bulkAdjustSlots, listUpdateRequests } from "../controllers/slotController.js";
import vendorAuth from "../middleware/vendorAuth.js";

const router = express.Router();

router.post("/slots", vendorAuth, createSlot);
router.put("/slots/:id", vendorAuth, updateSlot);
router.get("/slots", vendorAuth, listSlots);
router.get("/availabilities", vendorAuth, availabilities);
router.get("/layout", vendorAuth, layout);
router.post("/request-update", vendorAuth, requestUpdate);
router.patch("/slots/bulk", vendorAuth, bulkAdjustSlots);
router.get("/update-requests", listUpdateRequests);  

export default router;
