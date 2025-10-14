const mongoose = require("mongoose");

const offerLetterSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
    },
    phone: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    signtory: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model("OfferLetter", offerLetterSchema);
