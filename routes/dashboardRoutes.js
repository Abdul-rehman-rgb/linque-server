import express from 'express';
import { getVendorDashboard } from '../controllers/dashboardController.js';
import vendorAuth from '../middleware/vendorAuth.js';

const router = express.Router();

router.get('/vendor/dashboard', vendorAuth, getVendorDashboard);

export default router;