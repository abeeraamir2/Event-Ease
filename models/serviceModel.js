const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  category: {
    type: String,
    required: true,
    enum: ["venue", "catering", "decor", "photographer"],
    lowercase: true,
    index: true
  },
  
  location: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    default: ""
  },
  
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
    index: true
  },
  
  categoryDetails: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
serviceSchema.index({ vendorId: 1, status: 1 });
serviceSchema.index({ category: 1, status: 1, location: 1 });

module.exports = mongoose.model("Service", serviceSchema);
