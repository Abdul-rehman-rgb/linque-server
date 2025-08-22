import express from 'express';
import vendorAuth from '../middleware/vendorAuth.js';
import { listReservations, getReservation, createWalkIn, updateReservation, deleteReservation, sendReminder, bookingTicker } from '../controllers/vendorReservationController.js';

const router = express.Router();

router.get('/reservations', vendorAuth, listReservations);
router.get('/reservations/:id', vendorAuth, getReservation);
router.post('/reservations', vendorAuth, createWalkIn);
router.put('/reservations/:id', vendorAuth, updateReservation);
router.delete('/reservations/:id', vendorAuth, deleteReservation);
router.post('/reservations/:id/reminder', vendorAuth, sendReminder);
router.get('/booking-ticker', vendorAuth, bookingTicker);

export default router;


