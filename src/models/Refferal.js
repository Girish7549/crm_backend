const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },

    plan: { type: String },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },

    commission: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Referral", ReferralSchema);
