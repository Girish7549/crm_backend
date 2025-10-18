const Feedback = require("../models/Feedback");
const Customer = require("../models/Customer");

// Create feedback
const createFeedback = async (req, res) => {
    try {
        const { customer, service, rating, comment, createdBy } = req.body;

        // Ensure customer exists
        const existingCustomer = await Customer.findById(customer);
        if (!existingCustomer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const feedback = new Feedback({
            customer,
            service,
            rating,
            comment,
            createdBy,
        });

        await feedback.save();
        res.status(201).json({ success: true, message: "Feedback submitted successfully", feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Get all feedbacks (admin view)
const getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("customer", "name email phone")
            .populate("service", "name")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Get feedback by customer ID
const getFeedbackByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const feedbacks = await Feedback.find({ customer: customerId })
            .populate("service", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Feedback.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        res.status(200).json({ success: true, message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = { createFeedback, getFeedbackByCustomer, getAllFeedbacks, deleteFeedback }
