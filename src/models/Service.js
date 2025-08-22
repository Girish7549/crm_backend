const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  revenue: {
    type: Number,
    default: 0,
  }, // Total revenue from this service
  plans: {
    type: [String],
  },
  profit: {
    type: Number,
    default: 0,
  }, // Total profit from this service
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }, // Assigned Manager
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
