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
    enum: ["admin", "sub_admin", "activation", "manager", "sales_agent", "support", "hr"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
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
  target: {
    type: Number,
    default: 20,
  },
  incentive: {
    type: Number,
    default: 0
  },
  empId: { type: String, unique: true },
  department: { type: String },
  designation: { type: String },
  bankName: { type: String },
  ifscCode: { type: String },
  bankAccount: { type: String },
  branchName: { type: String },
  salary: { type: Number, default: 10000 },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  designation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation",
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  globalAccess: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
