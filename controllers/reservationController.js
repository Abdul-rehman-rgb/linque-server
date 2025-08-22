import Reservation from "../Models/Reservation.js";
import ReservationSlot from "../Models/ReservationSlot.js";
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

export const bookReservation = async (req, res) => {
  try {
    const { restaurantId, reservationDate, reservationTime, numberOfPersons, notes, promoCode } = req.body;
    const customerId = req.user._id;

    const bucketUpper = getSeatBucketUpperBound(numberOfPersons);
    const slot = await ReservationSlot.findOne({
      restaurant: restaurantId,
      date: reservationDate,
      time: reservationTime,
      personsPerSlot: bucketUpper,
    });

    if (!slot || slot.availableSlots <= 0) {
      return res.status(400).json({ success: false, message: "Slot unavailable or exceeds limit." });
    }

    slot.availableSlots -= 1;
    await slot.save();

    const reservation = await Reservation.create({
      customer: customerId,
      restaurant: restaurantId,
      reservationDate,
      reservationTime,
      numberOfPersons,
      notes,
      promoCode,
      source: "LINQUE",
      slot: slot._id,
    });

    const customerMsg = `Your reservation at ${reservationTime} on ${reservationDate} is confirmed.`;
    const vendorMsg = `${req.user.name} booked ${numberOfPersons} seat(s) on ${reservationDate} at ${reservationTime}.`;

    await Notification.create({ user: customerId, message: customerMsg, type: "customer" });
    await Notification.create({ vendor: restaurantId, message: vendorMsg, type: "vendor" });
    emitToUser(customerId.toString(), customerMsg);
    emitToVendor(restaurantId.toString(), vendorMsg);

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};