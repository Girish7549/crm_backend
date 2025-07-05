const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    loginTime: {
      type: Date,
      required: true,
    },
    logoutTime: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['full', 'half', 'absent'],
      default: 'absent'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
