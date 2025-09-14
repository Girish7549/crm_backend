const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    logo: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model("Invoice", invoiceSchema);
