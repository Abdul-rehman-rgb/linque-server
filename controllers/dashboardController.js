import Reservation from '../Models/Reservation.js';

export const getVendorDashboard = async (req, res) => {
  try {
    const reservations = await Reservation.find({ restaurant: req.vendor._id })
      .populate('customer', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};