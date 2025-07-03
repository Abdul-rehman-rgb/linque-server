import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import vendorAuth from '../middleware/vendorAuth.js';

const router = express.Router();

router.get('/notifications', authMiddleware, getNotifications);
router.get('/vendor/notifications', vendorAuth, getNotifications);
router.put('/notifications/:id/read', authMiddleware, markAsRead);
router.put('/vendor/notifications/:id/read', vendorAuth, markAsRead);

export default router;