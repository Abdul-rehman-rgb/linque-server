import Reservation from "../Models/Reservation.js";
import ReservationSlot from "../Models/ReservationSlot.js";
import Notification from "../Models/Notification.js";

export const bookReservation = async (req, res) => {
  try {
    const { restaurantId, reservationDate, reservationTime, numberOfPersons, notes } = req.body;
    const customerId = req.user._id;

    const slot = await ReservationSlot.findOne({
      restaurant: restaurantId,
      date: reservationDate,
      time: reservationTime,
    });

    if (!slot || slot.availableSlots <= 0 || numberOfPersons > slot.personsPerSlot) {
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
    });

    const customerMsg = `Your reservation at ${reservationTime} on ${reservationDate} is confirmed.`;
    const vendorMsg = `${req.user.name} booked ${numberOfPersons} seat(s) on ${reservationDate} at ${reservationTime}.`;

    await Notification.create({ user: customerId, message: customerMsg, type: "customer" });
    await Notification.create({ vendor: restaurantId, message: vendorMsg, type: "vendor" });

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};