const mongoose = require("mongoose");

const DesignationSchema = new mongoose.Schema({
    designation: {
        type: String,
        required: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },
    level: {
        type: String,
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Designation", DesignationSchema);
