import mongoose from "mongoose";

const reservationSlotSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "VendorUser", required: true },
  date: { type: String, required: true }, // "2025-07-05"
  time: { type: String, required: true }, // "19:00"
  personsPerSlot: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("ReservationSlot", reservationSlotSchema);