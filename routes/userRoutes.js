const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const authMiddleware = require("../middleware/authMiddleware");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ========== SIGNUP ==========
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, contact, city } = req.body;

    console.log('Signup request:', { name, email, contact, city });

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      contact: contact || '',
      city: city || '',
      role: 'customer' 
    });

    await user.save();

    console.log('User created:', user._id);

    const token = jwt.sign(
      { 
        id: user._id, 
        role: 'customer' 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        city: user.city,
        role: 'customer' 
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ========== LOGIN ==========
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log(' User found:', user._id);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log('Password matched');

    const token = jwt.sign(
      { 
        id: user._id, 
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log('Token generated for user:', user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        city: user.city,
        role: 'customer' 
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ========== GET PROFILE (PROTECTED) ==========
router.get("/profile", authMiddleware(['customer']), async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.id);
    
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      console.log('User not found in database:', req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Profile found:', user);
    res.json(user);
    
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ========== UPDATE PROFILE (PROTECTED) ==========
router.put("/profile", authMiddleware(['customer']), async (req, res) => {
  try {
    const { name, email, contact, city } = req.body;

    console.log('Updating profile for user:', req.user.id);
    console.log('Update data:', { name, email, contact, city });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, contact, city },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Profile updated:', user);
    res.json({ message: "Profile updated", user });
    
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;