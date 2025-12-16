const mongoose = require("mongoose");

const TrustpilotUserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },
    dob: {
        type: Date
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        pincode: String,
    },
    profileImage: { type: String },

}, { timestamps: true });


module.exports = mongoose.model("TrustpilotUser", TrustpilotUserSchema);
