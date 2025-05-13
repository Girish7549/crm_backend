const mongoose = require("mongoose");

const FollowUpSchema = new mongoose.Schema({
  // customer: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Customer",
  // },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    // required: true
  },
  phone: {
    type: Number,
  },
  address: {
    type: String,
    required: true
  },
  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: [
    {
      note: {
        type: String,
      },
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // scheduledTime: {
  //   type: Date,
  //   required: true,
  // },
  expiredAt: {
    type: Date,
    default: () => {
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      return sevenDaysLater;
    },
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FollowUps", FollowUpSchema);
