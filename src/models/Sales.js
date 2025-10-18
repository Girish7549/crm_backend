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
        enum: [
          "gold",
          "platinum",
          "diamond",
          "Ultimate Vip Plan",
          "Premium Plus Plan",
          "Essential Plan",
        ],
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
          new: { type: Boolean },
          deviceType: { type: String, required: true },
          customPrice: { type: Number, required: true },
          month: { type: Number, required: true },
          lockMonth: { type: Number },
          paymentMethod: { type: String },
          createdAt: { type: Date, default: Date.now },
          status: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
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
    type: [
      {
        url: { type: String },
        date: { type: Date, default: Date.now },
        method: { type: String },
      },
    ],
    default: [],
  },
  voiceProof: {
    type: String,
    default: null,
  },
  paymentMethod: {
    type: String,
  },
  logs: [
    {
      previousData: {
        customPrice: Number,
        month: Number,
        paymentMethod: String,
        updatedAt: { type: Date, default: Date.now },
      },
      renewedBy: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
      },
      renewedAt: { type: Date, default: Date.now },
    },
  ],
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
    enum: ["pending", "done"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Sale", SaleSchema);
