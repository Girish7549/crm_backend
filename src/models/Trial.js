const mongoose = require("mongoose");

const TrialSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: Number,
  },
  address: {
    type: String,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  plan: {
    type: String,
    enum: ["gold", "platinum", "diamond"],
    required: true,
  },
  device: {
    type: String,
    required: true,
  },
  validation: {
    type: Date,
    default: () => {
      const oneHourLater = new Date();
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      return oneHourLater;
    },
  },

  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active", "done", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Trial", TrialSchema);
