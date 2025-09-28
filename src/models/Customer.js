const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    // required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
  },
  whatsapp: {
    type: String,
  },
  address: {
    type: String,
  },
  purchasedService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  // subscription: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Subscription"
  // },
  refferCode: {
    type: String,
  },
  refferedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  reffers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  ],
  totalEarning: {
    type: Number,
    default: 0
  },
  wallet: {
    bonusBalance: { type: Number, default: 50 }, // company gift
    commissionBalance: { type: Number, default: 0 },
    unlockedBalance: { type: Number, default: 0 },
  },
  referralCount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  trialCount: {
    type: Number,
    default: 12
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CustomerSchema.index({ email: 1, purchasedService: 1 }, { unique: true });

module.exports = mongoose.model("Customer", CustomerSchema);
