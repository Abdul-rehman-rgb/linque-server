import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorUser",
      required: true,
    },
    reservationDate: { type: String, required: true }, // e.g., "2025-07-05"
    reservationTime: { type: String, required: true }, // e.g., "19:00"
    numberOfPersons: { type: Number, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },
    type: { type: String, enum: ["walk-in", "linque"], default: "walk-in" },
    promoCode: { type: String },
    reminderSent: { type: Boolean, default: false },
    // Track the slot consumed so we can revert on update/cancel
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "ReservationSlot" },
  },
  { timestamps: true }
);

reservationSchema.index({
  restaurant: 1,
  reservationDate: 1,
  reservationTime: 1,
});

export default mongoose.model("Reservation", reservationSchema);
