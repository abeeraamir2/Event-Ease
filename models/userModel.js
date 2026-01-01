// models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    trim: true,
    default: ''
  },
  
  city: {
    type: String,
    trim: true,
    default: ''
  },
  
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);