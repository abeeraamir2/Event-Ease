// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ========== CREATE BOOKING WITH TRANSACTION (Customers Only) ==========
/*router.post("/add", authMiddleware(["customer"]), async (req, res) => {
  const session = await mongoose.startSession(); // Start transaction session
  session.startTransaction(); // Begin transaction

  try {
    const {
      serviceId,
      vendorId,
      customerName,
      contact,
      email,
      category,
      eventDate,
      eventTime,
      details,
      categoryDetails
    } = req.body;

    const userId = req.user.id; // from JWT

    // Validation
    if (!userId || !serviceId || !vendorId || !customerName || !contact || !email || !eventDate || !eventTime) {
      throw new Error("Missing required fields");
    }

    const alreadyBooked = await Booking.findOne({
      serviceId,
      eventDate,
      eventTime,
      status: { $in: ["Pending", "Accepted"] }
    }).session(session); 

    if (alreadyBooked) {
      throw new Error("Service already booked for this date and time");
    }

    const finalCategoryDetails = categoryDetails && typeof categoryDetails === "object"
      ? categoryDetails
      : {};

    const booking = new Booking({
      userId,
      serviceId,
      vendorId,
      customerName,
      contact,
      email,
      category,
      eventDate,
      eventTime,
      details: details || "",
      categoryDetails: finalCategoryDetails,
      status: "Pending"
    });

    await booking.save({ session }); // Save within transaction

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Booking created successfully",
      booking
    });

  } catch (err) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error('Transaction booking error:', err);
    res.status(err.message.includes("booked") ? 409 : 500).json({
      message: err.message
    });
  }
}); */


// ========== CREATE BOOKING (Customers Only) ==========
router.post("/add", authMiddleware(["customer"]), async (req, res) => {
  try {
    const {
      serviceId,
      vendorId,
      customerName,
      contact,
      email,
      category,
      eventDate,
      eventTime,
      details,
      categoryDetails
    } = req.body;

    const userId = req.user.id;

    console.log('Creating booking:', {
      userId,
      serviceId,
      vendorId,
      customerName,
      category,
      eventDate,
      eventTime
    });

    if (!userId || !serviceId || !vendorId || !customerName || !contact || !email || !eventDate || !eventTime) {
      return res.status(400).json({ 
        message: "Missing required fields",
        received: { userId, serviceId, vendorId, customerName, contact, email, eventDate, eventTime }
      });
    }

    // Check for double booking
    const alreadyBooked = await Booking.findOne({
      serviceId,
      eventDate,
      eventTime,
      status: { $in: ["Pending", "Accepted"] }
    });

    if (alreadyBooked) {
      console.log('Service already booked:', alreadyBooked._id);
      return res.status(409).json({ 
        message: "Service already booked for this date and time" 
      });
    }

    // Build categoryDetails
    const finalCategoryDetails = categoryDetails && typeof categoryDetails === "object" 
      ? categoryDetails 
      : {};

    console.log('Category details:', finalCategoryDetails);

    // Create booking
    const booking = new Booking({
      userId,
      serviceId,
      vendorId,
      customerName,
      contact,
      email,
      category,
      eventDate,
      eventTime,
      details: details || "",
      categoryDetails: finalCategoryDetails,
      status: "Pending"
    });

    await booking.save();

    console.log('Booking created successfully:', booking._id);

    res.status(201).json({ 
      message: "Booking created successfully", 
      booking: booking
    });

  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}); 

// ========== UPDATE BOOKING STATUS (Vendors Only) ==========
router.put("/:id/status", authMiddleware(["vendor"]), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Accepted", "Rejected"];

    console.log('Updating booking status:', { bookingId: req.params.id, status });

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify vendor owns this booking
    if (booking.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: "Access denied. You can only update your own bookings." 
      });
    }

    if (booking.status === "Rejected") {
      return res.status(400).json({ 
        message: "Rejected booking cannot be updated" 
      });
    }

    booking.status = status;
    await booking.save();

    console.log('Booking status updated');

    res.json({ 
      message: `Booking ${status.toLowerCase()} successfully`, 
      booking 
    });

  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== UPDATE BOOKING STATUS (Alternative route) ==========
router.put("/update-status/:id", authMiddleware(["vendor"]), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Accepted", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify vendor owns this booking
    if (booking.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    booking.status = status;
    await booking.save();

    res.json({ 
      message: `Booking ${status.toLowerCase()} successfully`, 
      booking 
    });

  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== GET BOOKINGS BY VENDOR (Vendors Only) ==========
router.get("/vendor/:vendorId", authMiddleware(["vendor"]), async (req, res) => {
  try {
    // Verify vendor is accessing their own bookings
    if (req.user.id !== req.params.vendorId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Booking.find({ vendorId: req.params.vendorId })
      .populate("serviceId", "name category location categoryDetails")
      .populate("vendorId", "name email contact")
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found', bookings.length, 'bookings for vendor:', req.params.vendorId);

    res.json(bookings);

  } catch (err) {
    console.error('Get vendor bookings error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== GET BOOKINGS BY USER (Customers Only) ==========
router.get("/user/:userId", authMiddleware(["customer"]), async (req, res) => {
  try {
    // Verify customer is accessing their own bookings
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("serviceId", "name category location")
      .populate("vendorId", "name email contact location")
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found', bookings.length, 'bookings for user:', req.params.userId);

    res.json({ bookings });

  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== GET SINGLE BOOKING (Both Roles) ==========
router.get("/:id", authMiddleware(["customer", "vendor"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("serviceId", "name category location description categoryDetails")
      .populate("vendorId", "name email contact location companyDescription")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify access rights
    if (req.user.role === "customer") {
      if (booking.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user.role === "vendor") {
      if (booking.vendorId._id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    console.log('Booking retrieved:', booking._id);

    res.json(booking);

  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== DELETE BOOKING (Customers Only - can cancel their own) ==========
router.delete("/:id", authMiddleware(["customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify customer owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only allow cancellation of pending bookings
    if (booking.status !== "Pending") {
      return res.status(400).json({ 
        message: "Only pending bookings can be cancelled" 
      });
    }

    await booking.deleteOne();

    console.log('Booking deleted:', req.params.id);

    res.json({ message: "Booking cancelled successfully" });

  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;