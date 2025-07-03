import mongoose from "mongoose";

const vendoruserSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true },
  mailingAddress: { type: String, required: true, trim: true },
  contactNumber:  { type: String, required: true },
  city:           { type: String, required: true },
  category: {
    type: String,
    enum: ['live events', 'venues', 'restaurants', 'activities'],
    required: true
  },
  profileImage:   { type: String },
}, {
  timestamps: true
});

const VendorUser = mongoose.model("VendorUser", vendoruserSchema);
export default VendorUser;
