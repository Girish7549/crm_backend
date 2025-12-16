const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TrustpilotUser",
        },
        // name: {
        //     type: String,
        //     required: true,
        //     trim: true,
        // },
        reviewTitle: {
            type: String,
            required: true,
            trim: true,
        },
        reviewText: {
            type: String,
            required: true,
            trim: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        dateOfExperience: {
            type: Date,
            required: true,
        },
        // profileImage: {
        //     type: String, // store image path or URL
        // },
        reviewImg: {
            type: String, // store image path or URL
        },
        isActive: {
            type: Boolean,
            default: true, // default active
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

module.exports = mongoose.model("Review", reviewSchema);
