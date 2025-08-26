import mongoose from "mongoose";

const reservationSlotSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "VendorUser", required: true },
  date: { type: String, required: true }, // "2025-08-26"
  personsPerSlot: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("ReservationSlot", reservationSlotSchema);