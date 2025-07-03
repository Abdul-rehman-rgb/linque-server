import jwt from 'jsonwebtoken';
import VendorUser from '../Models/VendorUser.js';

const vendorAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const vendor = await VendorUser.findById(decoded._id).select('-password');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    console.error('Vendor Auth Error:', error.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export default vendorAuth;
