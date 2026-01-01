const express = require("express");
const Vendor = require("../models/vendorModel");
const bcrypt = require("bcrypt"); 
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// ========== VENDOR SIGNUP ==========
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, contact, location, companyDescription } = req.body;

    console.log('Vendor signup request:', { name, email, contact });

    if (!name || !email || !password || !confirmPassword || !contact) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
    if (existingVendor) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = await Vendor.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      contact,
      location: location || "",
      companyDescription: companyDescription || "",
      role: 'vendor'
    });

    console.log('Vendor created:', vendor._id);

    const token = jwt.sign(
      { 
        id: vendor._id, 
        role: "vendor" 
      }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Vendor registered successfully!",
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        contact: vendor.contact,
        location: vendor.location,
        companyDescription: vendor.companyDescription,
        role: 'vendor' 
      },
    });

  } catch (err) {
    console.error('Vendor signup error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ========== VENDOR LOGIN ==========
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Vendor login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const vendor = await Vendor.findOne({ email: email.toLowerCase() });
    if (!vendor) {
      console.log('Vendor not found:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log('Vendor found:', vendor._id);

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log('Password matched');

    const token = jwt.sign(
      { 
        id: vendor._id, 
        role: "vendor" 
      }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );

    console.log('Token generated for vendor:', vendor._id);

    res.status(200).json({
      message: "Login successful",
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        contact: vendor.contact,
        location: vendor.location,
        role: 'vendor' 
      },
    });

  } catch (err) {
    console.error('Vendor login error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;