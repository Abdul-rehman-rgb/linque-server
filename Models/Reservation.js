import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurant:      { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  reservationDate: { type: Date, required: true },
  reservationDay:  { type: String, required: true },
  numberOfPersons: { type: Number, required: true },
  notes:           { type: String },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model("Reservation", reservationSchema);
