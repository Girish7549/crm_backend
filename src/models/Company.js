const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    // email: {
    //     type: String,
    //     required: true,
    //     trim: true,
    // },
    // logo: {
    //     type: String,
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model("Company", companySchema);