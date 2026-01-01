const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User",required: true},
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  customerName: { type:String, required: true},
  contact: { type: String, required: true },
  email: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ["venue", "catering", "decor", "photographer"],
    lowercase: true,
    index: true
  },
  eventDate: { type: Date, required: true },
  eventTime: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  details: { type: String },

  categoryDetails: {
    type: Object,
    default: {}
  },

  status: { type: String, enum: ['Accepted', 'Rejected', 'Pending'], default: 'Pending' }

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
