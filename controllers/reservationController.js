import Reservation from '../Models/Reservation.js';
import Restaurant from '../Models/Restaurant.js';
import Notification from '../Models/Notification.js';
import User from '../Models/User.js';

// Customer creates reservation
export const createReservation = async (req, res) => {
  try {
    const { restaurantId, reservationDate, reservationDay, numberOfPersons, notes } = req.body;

    const reservation = await Reservation.create({
      customer: req.user._id,
      restaurant: restaurantId,
      reservationDate,
      reservationDay,
      numberOfPersons,
      notes,
    });

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vendor views reservations for their restaurant
export const getVendorReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ restaurant: req.vendor.restaurant })
      .populate('customer', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vendor updates reservation status and notifies customer
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findByIdAndUpdate(id, { status }, { new: true })
      .populate('customer')
      .populate('restaurant');

    const message = `Your reservation has been ${status} at ${reservation.restaurant.name} on ${reservation.reservationDay}, ${new Date(reservation.reservationDate).toLocaleDateString()}`;

    await Notification.create({ user: reservation.customer._id, message });

    res.status(200).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
