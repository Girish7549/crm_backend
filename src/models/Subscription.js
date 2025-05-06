const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    sale: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    planName: {
        type: String,
        required: true
    }, 
    deviceMacAddress: {
        type: String,
        required: true,
    },
    // deviceType: {
    //     type: String,
    //     required: true
    // },
    username: {
        type: String
    },
    password: {
        type: String
    },
    url: {
        type: String,
        required: true 
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate; 
            },
            message: "End date must be after start date"
        }
    },
    remainingDays: {
        type: Number,
        // default: function () {
        //     return Math.ceil((this.endDate - Date.now()) / (1000 * 60 * 60 * 24)); 
        // }
    },
    status: {
        type: String,
        enum: ["active", "expired"],
        default: "active"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-update `remainingDays` before saving
SubscriptionSchema.pre("save", function (next) {
    this.remainingDays = Math.ceil((this.endDate - Date.now()) / (1000 * 60 * 60 * 24));
    next();
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
