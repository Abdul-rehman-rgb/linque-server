import express from "express";
import { login, signup, verify } from "../controllers/VendorAuthController.js";
import vendorMiddleware from "../middleware/vendorAuth.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/verify", vendorMiddleware, verify);

export default router;
