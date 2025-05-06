const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  saleItems: [
    {
      plan: {
        type: String,
        enum: ["gold", "platinum", "diamond"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      qty: {
        type: Number,
        required: true,
      },
      devices: [
        {
          deviceType: { type: String, required: true },
          customPrice: { type: Number, required: true },
          month: { type: Number, required: true },
        },
      ],
      status: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid",
      },
    },
  ],
  invoiceNumber: {
    type: String,
    unique: true,
    default: () => "INV-" + Date.now(),
  },
  totalAmount: {
    type: Number,
  },
  paymentProof: {
    type: [String],
    default: [],
  },
  voiceProof: {
    type: String,
    default: null,
  },
  paymentMethod: {
    type: String,
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "done", "cancelled"],
    default: "pending",
  },
  activation: {
    type: String,
    enum: ["pending", "done",],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Sale", SaleSchema);
