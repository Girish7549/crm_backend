const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  phone: {
    type: String,
    required: true,
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

module.exports = mongoose.model("Customer", CustomerSchema);
