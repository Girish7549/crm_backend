// const mongoose = require("mongoose");

// const ActivationSchema = new mongoose.Schema({
//   sale: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Sale",
//     default: null,
//   },
//   trial: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Trial",
//     default: null,
//   },
//   team: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Team",
//   },
//   assignedEmployee: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
//   username: {
//     type: String,
//   },
//   password: {
//     type: String,
//   },
//   applicationName: {
//     type: String,
//   },
//   macAddress: {
//     type: String,
//   },
//   url: {
//     type: String,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "completed"],
//     default: "pending",
//   },
//   notes: {
//     note: {
//       type: String,
//     },
//     employee: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     createdAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   month: {
//     type: Number,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now(),
//   },
// });

// module.exports = mongoose.model("Activation", ActivationSchema);

const mongoose = require("mongoose");

const ActivationSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  deviceInfo: {
    deviceType: { type: String },
    customPrice: { type: Number },
    plan: { type: String },
    totalMonths: { type: Number },
  },

  applicationName: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  macAddress: {
    type: String,
    default: null
  },
  url: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ["pending", "active", "granted", "expired-soon", "expired"],
    default: "pending",
  },
  currentMonth: {
    type: Number,
    default: 1,
  },
  // lastActivatedAt: {
  //   type: Date,
  //   default: Date.now,
  // },
  expirationDate: {
    type: Date,
    default: null
  },
  assignedEmployee: {
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ActivationSchema.pre("findOneAndUpdate", function (next) {
//   const update = this.getUpdate();

//   const status = update.status || (update.$set && update.$set.status);

//   if (status === "active") {
//     const oneMonthLater = new Date();
//     oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

//     if (update.$set) {
//       update.$set.expirationDate = oneMonthLater;
//     } else {
//       update.expirationDate = oneMonthLater;
//     }

//     this.setUpdate(update);
//   }

//   next();
// });
ActivationSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  // Extract the new status from update
  const newStatus = update.status || (update.$set && update.$set.status);

  if (newStatus === "active") {
    // Fetch the existing document to check previous status
    const existing = await this.model.findOne(this.getQuery());

    // Only set expirationDate if the status was NOT already "active"
    if (existing && existing.status !== "active") {
      const monthsToAdd = existing.deviceInfo?.totalMonths || 1;
      const newExpiration = new Date();
      newExpiration.setMonth(newExpiration.getMonth() + monthsToAdd);

      if (update.$set) {
        update.$set.expirationDate = newExpiration;
      } else {
        update.expirationDate = newExpiration;
      }

      this.setUpdate(update);
    }
  }

  next();
});


module.exports = mongoose.model("Activation", ActivationSchema);
