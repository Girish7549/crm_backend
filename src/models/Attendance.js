const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  punchIn: { type: Date },
  punchOut: { type: Date },

  // Breaks
  break1Start: { type: Date },
  break1End: { type: Date },
  lunchStart: { type: Date },
  lunchEnd: { type: Date },
  break2Start: { type: Date },
  break2End: { type: Date },

  totalWorkingHours: { type: Number, default: 0 },
  totalBreakMinutes: { type: Number, default: 0 },

  type: { type: String, default: 'half-day' },
  status: { type: String, default: 'present' },

  shiftType: {
    type: String,
    enum: ["morning", "night"],
    default: "morning",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
