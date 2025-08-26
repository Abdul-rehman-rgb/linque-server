import ReservationSlot from "../Models/ReservationSlot.js";
import { emitToVendor } from "../socket.js";
import LayoutUpdateRequest from "../Models/LayoutUpdateRequest.js";
import nodemailer from "nodemailer";
import { DEFAULT_SEAT_AVAILABILITY as DEFAULT_SEAT_CONFIG } from "../config/seatConfig.js";


// Default seat configuration - this should match your frontend config
// const DEFAULT_SEAT_CONFIG = {
//   '2': 4,      // 2 seats: 4 available
//   '4': 6,      // 4 seats: 6 available
//   '6': 5,      // 6 seats: 5 available
//   '8': 3,      // 8 seats: 3 available
//   '10': 2,     // 10 seats: 2 available
//   '11-15': 3,  // 11-15 seats: 3 available
//   '16-20': 1,  // 16-20 seats: 1 available
//   '20+': 0,    // 20+ seats: 0 available
//   '30+': 1,    // 30+ seats: 1 available
//   '50+': 0     // 50+ seats: 0 available
// };

export const ensureDefaultSlots = async (restaurant, date) => {
  try {
    // Check if slots already exist for this date
    const existingCount = await ReservationSlot.countDocuments({ restaurant, date });
    if (existingCount > 0) {
      console.log(`✅ Slots already exist for ${date} (${existingCount} slots)`);
      
      // Clean up any duplicate slots to ensure only one per category
      await cleanupDuplicateSlots(restaurant, date);
      
      return;
    }

    console.log(`🔄 Creating default slots for restaurant ${restaurant} on ${date}`);
    
    // Create slots for each seat category with EXACT values from config
    const slotsToCreate = [];
    
    for (const [seatCategory, defaultCount] of Object.entries(DEFAULT_SEAT_CONFIG)) {
      // Map seat categories to actual persons per slot for database
      let personsPerSlot;
      switch (seatCategory) {
        case '2': personsPerSlot = 2; break;
        case '4': personsPerSlot = 4; break;
        case '6': personsPerSlot = 6; break;
        case '8': personsPerSlot = 8; break;
        case '10': personsPerSlot = 10; break;
        case '11-15': personsPerSlot = 15; break;
        case '16-20': personsPerSlot = 20; break;
        case '20+': personsPerSlot = 25; break;
        case '30+': personsPerSlot = 30; break;
        case '50+': personsPerSlot = 50; break;
        default: personsPerSlot = parseInt(seatCategory) || 2;
      }

      slotsToCreate.push({
        restaurant,
        date,
        personsPerSlot,
        availableSlots: defaultCount // Use EXACT value from config
      });
      
      console.log(`📝 Creating slot: ${personsPerSlot} persons = ${defaultCount} available`);
    }

    // Insert all slots at once for better performance
    const createdSlots = await ReservationSlot.insertMany(slotsToCreate);
    console.log(`✅ Created ${createdSlots.length} default slots for ${date}`);
    
    // Verify the created slots
    const verifySlots = await ReservationSlot.find({ restaurant, date });
    console.log(`🔍 Verification - slots created:`, verifySlots.map(s => `${s.personsPerSlot} persons: ${s.availableSlots} available`));
    
    return createdSlots;
  } catch (error) {
    console.error(`❌ Error creating default slots:`, error);
    throw error;
  }
};

// Clean up duplicate slots to ensure only one per category per date
export const cleanupDuplicateSlots = async (restaurant, date) => {
  try {
    console.log(`🧹 Cleaning up duplicate slots for restaurant ${restaurant} on ${date}`);
    
    // Get all slots for this restaurant and date
    const allSlots = await ReservationSlot.find({ restaurant, date });
    
    // Group by personsPerSlot to find duplicates
    const groupedSlots = {};
    allSlots.forEach(slot => {
      if (!groupedSlots[slot.personsPerSlot]) {
        groupedSlots[slot.personsPerSlot] = [];
      }
      groupedSlots[slot.personsPerSlot].push(slot);
    });
    
    // For each group, keep only one slot and delete the rest
    for (const [personsPerSlot, slots] of Object.entries(groupedSlots)) {
      if (slots.length > 1) {
        console.log(`🧹 Found ${slots.length} slots for ${personsPerSlot} persons, keeping first one`);
        
        // Keep the first slot, delete the rest
        const slotsToDelete = slots.slice(1);
        const slotIdsToDelete = slotsToDelete.map(slot => slot._id);
        
        await ReservationSlot.deleteMany({ _id: { $in: slotIdsToDelete } });
        console.log(`🧹 Deleted ${slotsToDelete.length} duplicate slots`);
      }
    }
    
    // Now ensure all slots have the correct default values
    const remainingSlots = await ReservationSlot.find({ restaurant, date });
    for (const slot of remainingSlots) {
      let expectedCount = 0;
      
      // Map personsPerSlot to expected default count
      if (slot.personsPerSlot === 2) expectedCount = DEFAULT_SEAT_CONFIG['2'];
      else if (slot.personsPerSlot === 4) expectedCount = DEFAULT_SEAT_CONFIG['4'];
      else if (slot.personsPerSlot === 6) expectedCount = DEFAULT_SEAT_CONFIG['6'];
      else if (slot.personsPerSlot === 8) expectedCount = DEFAULT_SEAT_CONFIG['8'];
      else if (slot.personsPerSlot === 10) expectedCount = DEFAULT_SEAT_CONFIG['10'];
      else if (slot.personsPerSlot <= 15) expectedCount = DEFAULT_SEAT_CONFIG['11-15'];
      else if (slot.personsPerSlot <= 20) expectedCount = DEFAULT_SEAT_CONFIG['16-20'];
      else if (slot.personsPerSlot <= 25) expectedCount = DEFAULT_SEAT_CONFIG['20+'];
      else if (slot.personsPerSlot <= 30) expectedCount = DEFAULT_SEAT_CONFIG['30+'];
      else expectedCount = DEFAULT_SEAT_CONFIG['50+'];
      
      // Update slot to default value if it's different
      if (slot.availableSlots !== expectedCount) {
        slot.availableSlots = expectedCount;
        await slot.save();
        console.log(`🔄 Updated slot ${slot.personsPerSlot} persons to default value: ${expectedCount}`);
      }
    }
    
    console.log(`✅ Cleanup completed for ${date}`);
  } catch (error) {
    console.error(`❌ Error during cleanup:`, error);
  }
};

export const createSlot = async (req, res) => {
  try {
    const { date, personsPerSlot, availableSlots } = req.body;
    const restaurant = req.vendor._id;

    const slot = await ReservationSlot.create({
      restaurant,
      date,
      personsPerSlot,
      availableSlots,
    });

    res.status(201).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSlots = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date, slots } = req.body;
    
    console.log('🔍 Creating slots for restaurant:', restaurant);
    console.log('🔍 Date:', date);
    console.log('🔍 Slots data:', slots);
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: "Date parameter is required" 
      });
    }
    
    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({ 
        success: false, 
        error: "Slots array is required" 
      });
    }
    
    const createdSlots = [];
    
    for (const slotData of slots) {
      const { personsPerSlot, availableSlots } = slotData;
      
      // Check if slot already exists
      const existingSlot = await ReservationSlot.findOne({
        restaurant,
        date,
        personsPerSlot
      });
      
      if (existingSlot) {
        // Update existing slot
        existingSlot.availableSlots = availableSlots;
        await existingSlot.save();
        createdSlots.push(existingSlot);
        console.log('🔄 Updated existing slot:', existingSlot._id);
      } else {
        // Create new slot
        const newSlot = await ReservationSlot.create({
          restaurant,
          date,
          personsPerSlot,
          availableSlots
        });
        createdSlots.push(newSlot);
        console.log('✅ Created new slot:', newSlot._id);
      }
    }
    
    console.log('🎯 Total slots processed:', createdSlots.length);
    
    res.status(201).json({ 
      success: true, 
      message: `Successfully processed ${createdSlots.length} slots`,
      slots: createdSlots 
    });
  } catch (error) {
    console.error('❌ Error creating slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDefaultSlots = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: "Date parameter is required" 
      });
    }
    
    // Use the ensureDefaultSlots function
    const createdSlots = await ensureDefaultSlots(restaurant, date);
    
    res.status(201).json({ 
      success: true, 
      message: `Successfully created/updated default slots for ${date}`,
      slots: createdSlots || []
    });
  } catch (error) {
    console.error('❌ Error creating default slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, personsPerSlot, availableSlots } = req.body;

    const slot = await ReservationSlot.findByIdAndUpdate(
      id,
      { date, personsPerSlot, availableSlots },
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
    const slots = await ReservationSlot.find(filter).sort({ personsPerSlot: 1 });
    res.status(200).json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const availabilities = async (req, res) => {
  try {
    console.log('🔍 Availabilities endpoint called');
    console.log('🔍 Request user:', req.vendor);
    console.log('🔍 Request query:', req.query);
    
    const restaurant = req.vendor._id;
    const { date } = req.query;
    
    console.log('🔍 Restaurant ID:', restaurant);
    console.log('🔍 Date:', date);
    
    if (!date) {
      console.log('❌ No date provided');
      return res.status(400).json({ 
        success: false, 
        error: "Date parameter is required" 
      });
    }

    // Check if slots exist, if not create them (but don't recreate if they exist)
    const existingSlots = await ReservationSlot.find({ restaurant, date });
    if (existingSlots.length === 0) {
      console.log(`🔍 No slots found for ${date}, creating default slots...`);
      await ensureDefaultSlots(restaurant, date);
    } else {
      console.log(`✅ Slots already exist for ${date} (${existingSlots.length} slots)`);
    }
    
    // Re-fetch slots to make sure they exist
    const slots = await ReservationSlot.find({ restaurant, date });
    console.log(`🔍 Slots found for ${date}:`, slots.length);
    
    // Initialize buckets with zero (not defaults!)
    const buckets = {
      '2': 0,
      '4': 0,
      '6': 0,
      '8': 0,
      '10': 0,
      '11-15': 0,
      '16-20': 0,
      '20+': 0,
      '30+': 0,
      '50+': 0
    };
    
    // Map DB slots into correct categories
    for (const slot of slots) {
      let category;
      if (slot.personsPerSlot === 2) category = '2';
      else if (slot.personsPerSlot === 4) category = '4';
      else if (slot.personsPerSlot === 6) category = '6';
      else if (slot.personsPerSlot === 8) category = '8';
      else if (slot.personsPerSlot === 10) category = '10';
      else if (slot.personsPerSlot <= 15) category = '11-15';
      else if (slot.personsPerSlot <= 20) category = '16-20';
      else if (slot.personsPerSlot <= 25) category = '20+';
      else if (slot.personsPerSlot <= 30) category = '30+';
      else category = '50+';

      buckets[category] = slot.availableSlots; // ✅ exact value from DB
    }
    
    console.log('🎯 Final buckets for date:', buckets);
    
    res.status(200).json({ 
      success: true, 
      buckets,
      date,
      message: `Daily availability for ${date}`
    });
  } catch (error) {
    console.error('❌ Error in availabilities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const layout = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: "Date parameter is required" });
    }

    // Check if slots exist, if not create them (but don't recreate if they exist)
    const existingSlots = await ReservationSlot.find({ restaurant, date });
    if (existingSlots.length === 0) {
      console.log(`🔍 No slots found for ${date}, creating default slots...`);
      await ensureDefaultSlots(restaurant, date);
    } else {
      console.log(`✅ Slots already exist for ${date} (${existingSlots.length} slots)`);
    }

    const slots = await ReservationSlot.find({ restaurant, date }).sort({ personsPerSlot: 1 });
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
    const { date, adjustments, requestId } = req.body; // [{personsPerSlot, delta}]
    
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
      const slot = await ReservationSlot.findOne({ restaurant, date, personsPerSlot: adj.personsPerSlot });
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

// Force reset slots to default values (useful for testing)
export const forceResetSlots = async (req, res) => {
  try {
    const restaurant = req.vendor._id;
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: "Date parameter is required" 
      });
    }
    
    console.log(`🔄 Force resetting slots for restaurant ${restaurant} on ${date}`);
    
    // Delete all existing slots for this date
    await ReservationSlot.deleteMany({ restaurant, date });
    console.log(`🧹 Deleted all existing slots for ${date}`);
    
    // Create fresh default slots
    const createdSlots = await ensureDefaultSlots(restaurant, date);
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully reset slots to default values for ${date}`,
      slots: createdSlots || []
    });
  } catch (error) {
    console.error('❌ Error force resetting slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};