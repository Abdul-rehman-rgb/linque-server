import Reservation from "../Models/Reservation.js";
import ReservationSlot from "../Models/ReservationSlot.js";
import User from "../Models/User.js";
import Notification from "../Models/Notification.js";
import { emitToUser, emitToVendor } from "../socket.js";

const getSeatBucketUpperBound = (guestCount) => {
  if (guestCount <= 2) return 2;
  if (guestCount <= 4) return 4;
  if (guestCount <= 6) return 6;
  if (guestCount <= 8) return 8;
  if (guestCount <= 10) return 10;
  if (guestCount <= 15) return 15;
  if (guestCount <= 20) return 20;
  if (guestCount <= 25) return 25;
  if (guestCount <= 30) return 30;
  if (guestCount <= 50) return 50;
  return 50;
};

export const listReservations = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { date, period, status, source } = req.query;

    const filter = { restaurant: vendorId };
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (date) filter.reservationDate = date;

    if (period === 'week') {
      const now = new Date(date || Date.now());
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      filter.createdAt = { $gte: start, $lte: now };
    }
    if (period === 'month') {
      const now = new Date(date || Date.now());
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      filter.createdAt = { $gte: start, $lte: now };
    }

    const reservations = await Reservation.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id).populate('customer', 'name email');
    if (!reservation) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createWalkIn = async (req, res) => {
  try {
    const { reservationDate, reservationTime, numberOfPersons, type } = req.body;
    const vendorId = req.vendor._id;

    // round persons to nearest bucket
    const bucketUpper = getSeatBucketUpperBound(numberOfPersons);

    // check slot
    let slot = await ReservationSlot.findOne({
      restaurant: vendorId,
      date: reservationDate,
      time: reservationTime,
      personsPerSlot: bucketUpper,
    });

    if (!slot) {
      slot = await ReservationSlot.create({
        restaurant: vendorId,
        date: reservationDate,
        time: reservationTime,
        personsPerSlot: bucketUpper,
        availableSlots: 5, // default capacity
      });
    }

    if (slot.availableSlots <= 0) {
      return res.status(400).json({ success: false, error: "Slot full" });
    }

    // reduce slot
    slot.availableSlots -= 1;
    await slot.save();

    // customer logic
    let customerId = null;
    if (type === "app") {
      // assume req.user._id is populated for logged-in app users
      customerId = req.user?._id;
      if (!customerId) {
        return res.status(400).json({ success: false, error: "App booking requires customer" });
      }
    } else {
      // Walk-in → keep null
      customerId = null;
    }

    // save booking
    const booking = await Reservation.create({
      restaurant: vendorId,
      reservationDate,
      reservationTime,
      numberOfPersons,
      customer: customerId,
      type, // "walk-in" | "app"
      slot: slot._id,
    });

    emitToVendor(vendorId.toString(), "New reservation created");
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error("createReservation error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const before = await Reservation.findById(id);
    if (!before) return res.status(404).json({ success: false, error: 'Not found' });

    let slotToUse = null;
    if (updates.numberOfPersons || updates.reservationTime || updates.reservationDate) {
      const num = updates.numberOfPersons || before.numberOfPersons;
      const date = updates.reservationDate || before.reservationDate;
      const time = updates.reservationTime || before.reservationTime;
      const bucketUpper = getSeatBucketUpperBound(num);
      slotToUse = await ReservationSlot.findOne({ restaurant: before.restaurant, date, time, personsPerSlot: bucketUpper });
      if (!slotToUse || slotToUse.availableSlots <= 0) return res.status(400).json({ success: false, error: 'No availability for updated slot' });
    }

    if (slotToUse && before.slot && String(before.slot) !== String(slotToUse._id)) {
      const prev = await ReservationSlot.findById(before.slot);
      if (prev) { prev.availableSlots += 1; await prev.save(); }
      slotToUse.availableSlots -= 1; await slotToUse.save();
      updates.slot = slotToUse._id;
    }

    const reservation = await Reservation.findByIdAndUpdate(id, updates, { new: true });
    emitToVendor(reservation.restaurant.toString(), 'Reservation updated');
    res.status(200).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ success: false, error: 'Not found' });
    if (reservation.slot) {
      const slot = await ReservationSlot.findById(reservation.slot);
      if (slot) { slot.availableSlots += 1; await slot.save(); }
    }
    await Reservation.findByIdAndDelete(id);
    emitToVendor(reservation.restaurant.toString(), 'Reservation deleted');
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ success: false, error: 'Not found' });
    if (reservation.reminderSent) return res.status(400).json({ success: false, error: 'Reminder already sent' });
    const message = `Reminder: Your reservation is on ${reservation.reservationDate} at ${reservation.reservationTime}.`;
    await Notification.create({ user: reservation.customer, message, type: 'customer' });
    reservation.reminderSent = true;
    await reservation.save();
    emitToUser(reservation.customer.toString(), message);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bookingTicker = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { date, time } = req.query;
    const filter = { restaurant: vendorId };
    if (date) filter.reservationDate = date;
    if (time) filter.reservationTime = time;
    const reservations = await Reservation.find(filter).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


