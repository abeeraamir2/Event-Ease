const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  password: {
    type: String,
    required: true
  },
  
  contact: {
    type: String,
    required: true,
    trim: true
  },
  
  location: {
    type: String,
    trim: true,
    default: ""
  },
  
  companyDescription: {
    type: String,
    trim: true,
    default: ""
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Vendor", vendorSchema);