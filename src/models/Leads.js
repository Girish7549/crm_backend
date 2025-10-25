const mongoose = require('mongoose');

const LeadsSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    paymentOption: {
        type: String,
        required: true
    },
    device: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
    },
    customerExpectation: {
        type: Number,
    },
    currentIptvService: {
        type: String,
        trim: true
    },
    monthsRemaining: {
        type: Number,
    },
    numberOfDevices: {
        type: Number,
    },
    billingDetails: {
        nameOnCard: { type: String, trim: true },
        cardNumber: { type: String, trim: true },
        cvv: { type: String, trim: true },
        expiryDate: { type: String, trim: true },
        billingAddress: {
            country: { type: String, trim: true },
            state: { type: String, trim: true },
            city: { type: String, trim: true },
            streetAddress: { type: String, trim: true },
            postcode: { type: String, trim: true }
        }
    },
    ottPlatform: {
        type: Boolean,
        default: false
    },
    interest: {
        type: String,
        trim: true
    },
    interestedPlan: {
        type: String,
        trim: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    isSubscriber: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Leads', LeadsSchema);
