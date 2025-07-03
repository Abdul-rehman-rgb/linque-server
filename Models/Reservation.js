import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "VendorUser", required: true },
  reservationDate: { type: String, required: true }, // e.g., "2025-07-05"
  reservationTime: { type: String, required: true }, // e.g., "19:00"
  numberOfPersons: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, enum: ["booked", "cancelled", "completed"], default: "booked" }
}, { timestamps: true });

export default mongoose.model("Reservation", reservationSchema);