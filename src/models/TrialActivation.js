const mongoose = require("mongoose");

const TrialActivationSchema = new mongoose.Schema({
  trial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trial",
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // customer: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Customer",
  //   required: true,
  // },
  applicationName: {
    type: String,
    default: null,
  },
  username: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  macAddress: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
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
  status: {
    type: String,
    enum: ["pending", "granted", "active", "done"],
    default: "pending",
  },

  expirationDate: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

TrialActivationSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "active") {
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    this.expirationDate = oneHourLater; 
  }
  next();
});

TrialActivationSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  const status = update.status || (update.$set && update.$set.status);

  if (status === "active") {
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);

    if (update.$set) {
      update.$set.expirationDate = oneHourLater;
    } else {
      update.expirationDate = oneHourLater;
    }

    this.setUpdate(update);
  }

  next();
});

module.exports = mongoose.model("TrialActivation", TrialActivationSchema);
