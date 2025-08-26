import express from "express";
import { availabilities, layout, requestUpdate, bulkAdjustSlots, listUpdateRequests, forceResetSlots } from "../controllers/slotController.js";
import vendorAuth from "../middleware/vendorAuth.js";

const router = express.Router();

// Vendor cannot create or update slots manually; only read endpoints are exposed
router.get("/availabilities", vendorAuth, availabilities);
router.get("/layout", vendorAuth, layout);

// Request layout update email to admin
router.post("/request-update", vendorAuth, requestUpdate);

// Force reset slots to default values (for testing/fixing issues)
router.post("/force-reset", vendorAuth, forceResetSlots);

// Admin/internal ops
router.patch("/slots/bulk", vendorAuth, bulkAdjustSlots);
router.get("/update-requests", listUpdateRequests);  

export default router;
