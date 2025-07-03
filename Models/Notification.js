import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "VendorUser" },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["customer", "vendor"], required: true }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);