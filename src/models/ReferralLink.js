// models/ReferralLink.js
const mongoose = require("mongoose");

const referralLinkSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer", // who created the link
        required: true,
    },
    plan: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    margin: {
        type: Number,
        default: 0,
    },
    finalPrice: {
        type: Number,
        required: true,
    },
    linkCode: {
        type: String,
        unique: true,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("ReferralLink", referralLinkSchema);
