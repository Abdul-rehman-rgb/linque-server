import mongoose from "mongoose";

const layoutUpdateRequestSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "VendorUser", required: true },
  restaurantName: { type: String },
  contactEmail: { type: String },
  message: { type: String },
  status: { type: String, enum: ["pending", "processed"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("LayoutUpdateRequest", layoutUpdateRequestSchema);


