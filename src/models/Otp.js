// models/Otp.js
const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, 
  },
});

module.exports = mongoose.model("Otp", OtpSchema);
