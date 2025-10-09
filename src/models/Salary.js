const mongoose = require("mongoose");

const SalarySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    month: {
        type: String, required: true
    },
    year: {
        type: Number, required: true
    },
    baseSalary: {
        type: Number, required: true
    },
    workingHours: {
        type: Number, default: 0
    },
    overtime: {
        type: Number, default: 0
    },
    incentives: {
        type: Number, default: 0
    },
    deductions: {
        type: Number, default: 0
    },
    netSalary: {
        type: Number, required: true
    },
    breakdown: {
        fullDays: { type: Number, default: 0 },
        halfDays: { type: Number, default: 0 },
        absents: { type: Number, default: 0 },
        onLeave: { type: Number, default: 0 },
    },
    slipGenerated: {
        type: Boolean, default: false
    },
    slipSent: {
        type: Boolean, default: false
    },
    createdAt: {
        type: Date, default: Date.now
    },
});

module.exports = mongoose.model("Salary", SalarySchema);
