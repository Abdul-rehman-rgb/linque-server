import ReservationSlot from "../Models/ReservationSlot.js";

export const createSlot = async (req, res) => {
  try {
    const { date, time, personsPerSlot, availableSlots } = req.body;
    const restaurant = req.vendor._id;

    const slot = await ReservationSlot.create({
      restaurant,
      date,
      time,
      personsPerSlot,
      availableSlots,
    });

    res.status(201).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, personsPerSlot, availableSlots } = req.body;

    const slot = await ReservationSlot.findByIdAndUpdate(
      id,
      { date, time, personsPerSlot, availableSlots },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, error: "Slot not found" });
    }

    res.status(200).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};