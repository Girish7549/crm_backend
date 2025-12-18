const Review = require("../models/Review");
const cloudinary = require("../config/cloudinaryConfig");

// Upload helper
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "sales/reviews",
                use_filename: true,
                public_id: originalname.split(".")[0].trim(),
                unique_filename: false,
                resource_type: type === "audio" ? "video" : "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// ✅ Create a new review
const createReview = async (req, res) => {
    try {
        const { user, reviewTitle, reviewText, rating, dateOfExperience } = req.body;

        if (!user || !reviewTitle || !reviewText || !rating || !dateOfExperience) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // let profileImageUrl = null;
        let serviceImageUrl = null;

        // if (req.files?.profileImage?.length > 0) {
        //     profileImageUrl = await uploadBufferToCloudinary(
        //         req.files.profileImage[0].buffer,
        //         req.files.profileImage[0].originalname
        //     );
        // }

        if (req.files?.reviewImg?.length > 0) {
            serviceImageUrl = await uploadBufferToCloudinary(
                req.files.reviewImg[0].buffer,
                req.files.reviewImg[0].originalname
            );
        }

        const review = new Review({
            user,
            reviewTitle,
            reviewText,
            rating,
            dateOfExperience,
            // profileImage: profileImageUrl,
            reviewImg: serviceImageUrl,
            isActive: true, // default active
        });

        await review.save();
        res.status(201).json({ success: true, message: "Review submitted successfully", data: review });
    } catch (err) {
        console.error("Create Review Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ✅ Get all reviews (optionally only active)
const getReviews = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const filter = activeOnly === "true" ? { isActive: true } : {};
        const reviews = await Review.find(filter)
            .populate("user")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments();

        res.status(200).json(
            {
                success: true,
                data: reviews,
                pagination: {
                    totalItems: total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    perPage: limit,
                },
            });
    } catch (err) {
        console.error("Get Reviews Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ✅ Update a review by ID
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        // const { name, reviewTitle, reviewText, rating, dateOfExperience } = req.body;
        const { reviewTitle, reviewText, rating, comment, like, dateOfExperience } = req.body;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        // Update text fields
        // if (name) review.name = name;
        if (reviewTitle) review.reviewTitle = reviewTitle;
        if (reviewText) review.reviewText = reviewText;
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (like) review.like = like;
        if (dateOfExperience) review.dateOfExperience = dateOfExperience;

        // Update profile image (optional)
        if (req.files?.profileImage?.length > 0) {
            const profileImageUrl = await uploadBufferToCloudinary(
                req.files.profileImage[0].buffer,
                req.files.profileImage[0].originalname
            );
            review.profileImage = profileImageUrl;
        }

        // Update review image (optional)
        if (req.files?.reviewImg?.length > 0) {
            const reviewImgUrl = await uploadBufferToCloudinary(
                req.files.reviewImg[0].buffer,
                req.files.reviewImg[0].originalname
            );
            review.reviewImg = reviewImgUrl;
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review,
        });
    } catch (err) {
        console.error("Update Review Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};


// ✅ Delete a review by ID
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
        console.error("Delete Review Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ✅ Toggle active/inactive status
const toggleReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        review.isActive = !review.isActive;
        await review.save();

        res.status(200).json({ success: true, message: `Review is now ${review.isActive ? "active" : "inactive"}`, data: review });
    } catch (err) {
        console.error("Toggle Review Status Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = { createReview, getReviews, updateReview, deleteReview, toggleReviewStatus };
