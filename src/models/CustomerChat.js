const mongoose = require("mongoose");

const CustomerChatSchema = new mongoose.Schema({
    senderType: {
        type: String,
        enum: ["user", "customer"], 
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "senderType", 
        required: true,
    },
    receiverType: {
        type: String,
        enum: ["user", "customer"],
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "receiverType",
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    seen: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("CustomerChat", CustomerChatSchema);
