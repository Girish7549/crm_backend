const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  originalPassword: {
    type: String
  },
  role: {
    type: String,
    enum: ["admin", "activation", "manager", "sales_agent", "support"],
    required: true,
  },
  assignedService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  trialCount: {
    type: Number,
    default: 12,
    min: 0,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  globalAccess: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
