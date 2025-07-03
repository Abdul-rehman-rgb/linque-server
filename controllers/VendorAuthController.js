import jwt from "jsonwebtoken";
import VendorUser from "../Models/VendorUser.js";
import bcrypt from "bcrypt";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendorUser = await VendorUser.findOne({ email });
    if (!vendorUser) return res.status(404).json({ success: false, error: "User Not Found" });

    const isMatch = await bcrypt.compare(password, vendorUser.password);
    if (!isMatch) return res.status(401).json({ success: false, error: "Wrong Password" });

    const token = jwt.sign({ _id: vendorUser._id }, process.env.JWT_SECRET, { expiresIn: "10d" });

    return res.status(200).json({
      success: true,
      token,
      user: { _id: vendorUser._id, name: vendorUser.name, email: vendorUser.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      mailingAddress,
      contactNumber,
      city,
      category
    } = req.body;

    if (
      !name || !email || !password || !confirmPassword ||
      !mailingAddress || !contactNumber || !city || !category
    ) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }

    const existingUser = await VendorUser.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendorUser = await VendorUser.create({
      name,
      email,
      password: hashedPassword,
      mailingAddress,
      contactNumber,
      city,
      category
    });

    const token = jwt.sign({ _id: vendorUser._id }, process.env.JWT_SECRET, { expiresIn: "10d" });

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: vendorUser._id,
        name: vendorUser.name,  
        email: vendorUser.email,
        mailingAddress: vendorUser.mailingAddress,
        contactNumber: vendorUser.contactNumber,
        city: vendorUser.city,
        category: vendorUser.category
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const verify = (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

export { login, signup, verify };
