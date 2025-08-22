import ReservationSlot from "../Models/ReservationSlot.js";
import { emitToVendor } from "../socket.js";
import LayoutUpdateRequest from "../Models/LayoutUpdateRequest.js";
import nodemailer from "nodemailer";

export const createSlot = async (req, res) => {
  try {
    const { date, time, personsPerSlot, availableSlots } = req.body;
    const restaurant = req.vendor._id;

    const slot = await ReservationSlot.create({
      restaurant,
      date,
      time,
      personsPerSlot,
      availableSlots,
    });

    res.status(201).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, personsPerSlot, availableSlots } = req.body;

    const slot = await ReservationSlot.findByIdAndUpdate(
      id,
      { date, time, personsPerSlot, availableSlots },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, error: "Slot not found" });
    }

    res.status(200).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listSlots = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date } = req.query;
    const filter = { restaurant };
    if (date) filter.date = date;
    const slots = await ReservationSlot.find(filter).sort({ time: 1, personsPerSlot: 1 });
    res.status(200).json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const availabilities = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date } = req.query;
    const slots = await ReservationSlot.find({ restaurant, date });
    const buckets = {
      '2': 0, '4': 0, '6': 0, '8': 0, '10': 0,
      '11-15': 0, '16-20': 0, '21-25': 0, '26-30': 0, '31+': 0, '50+': 0
    };
    for (const s of slots) {
      const p = s.personsPerSlot;
      if (p === 2) buckets['2'] += s.availableSlots;
      else if (p === 4) buckets['4'] += s.availableSlots;
      else if (p === 6) buckets['6'] += s.availableSlots;
      else if (p === 8) buckets['8'] += s.availableSlots;
      else if (p === 10) buckets['10'] += s.availableSlots;
      else if (p <= 15) buckets['11-15'] += s.availableSlots;
      else if (p <= 20) buckets['16-20'] += s.availableSlots;
      else if (p <= 25) buckets['21-25'] += s.availableSlots;
      else if (p <= 30) buckets['26-30'] += s.availableSlots;
      else if (p <= 50) buckets['31+'] += s.availableSlots;
      else buckets['50+'] += s.availableSlots;
    }
    res.status(200).json({ success: true, buckets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const layout = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date } = req.query;
    const slots = await ReservationSlot.find({ restaurant, date }).sort({ personsPerSlot: 1, time: 1 });
    res.status(200).json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const requestUpdate = async (req, res) => {
  try {
    const { email, restaurantName, message } = req.body;

    const request = await LayoutUpdateRequest.create({
      vendor: req.vendor._id,
      restaurantName: restaurantName || req.vendor.name,
      contactEmail: email || req.vendor.email,
      message,
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'qureshihibban@gmail.com',
      subject: 'Layout Update Request',
      text: `Vendor: ${request.restaurantName}\nVendorId: ${request.vendor}\nContact: ${request.contactEmail}\nMessage: ${message || ''}`
    };

    await transporter.sendMail(mailOptions);

    emitToVendor(req.vendor._id.toString(), 'Your layout update request was sent.');
    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listUpdateRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    const requests = await LayoutUpdateRequest.find(filter)
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkAdjustSlots = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date, adjustments, requestId } = req.body; // [{time, personsPerSlot, delta}]
    
    // Verify this vendor has a pending update request
    if (requestId) {
      const updateRequest = await LayoutUpdateRequest.findOne({
        _id: requestId,
        vendor: restaurant,
        status: "pending"
      });
      if (!updateRequest) {
        return res.status(403).json({ 
          success: false, 
          error: "No pending update request found for this vendor" 
        });
      }
    }
    
    const results = [];
    for (const adj of adjustments || []) {
      const slot = await ReservationSlot.findOne({ restaurant, date, time: adj.time, personsPerSlot: adj.personsPerSlot });
      if (slot) {
        slot.availableSlots = Math.max(0, slot.availableSlots + (adj.delta || 0));
        await slot.save();
        results.push(slot);
      }
    }
    
    // Mark the update request as processed if requestId was provided
    if (requestId) {
      await LayoutUpdateRequest.findByIdAndUpdate(requestId, { status: "processed" });
    }
    
    res.status(200).json({ success: true, slots: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};