const CustomerChat = require("../models/CustomerChat");
const User = require("../models/User");
const Customer = require("../models/Customer");

// Get customer chat + assigned sales executive
const getCustomerChat = async (req, res) => {
    const { userId, customerId } = req.params;

    try {
        // Fetch messages
        const messages = await CustomerChat.find({
            $or: [
                { sender: userId, receiver: customerId },
                { sender: customerId, receiver: userId },
            ],
        })
            .sort({ createdAt: 1 })
            .populate([
                { path: "sender", select: "name email phone", model: "User" },
                { path: "receiver", select: "name email phone", model: "Customer" },
            ]);

        // Fetch customer to get assigned sales executive
        const customer = await Customer.findById(customerId).populate({
            path: "createdBy",
        });

        return res.status(200).json({
            success: true,
            salesExecutive: customer?.createdBy || null,
            messages,
        });
    } catch (err) {
        console.error("Error fetching customer chat:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load messages",
            error: err.message,
        });
    }
};


/**
 * @desc Get all customers assigned to a specific sales executive
 * @route GET /api/customers?assignedTo=:userId
 */
const getCustomersByUser = async (req, res) => {
    const assignedTo = req.params.id;

    try {
        let customers = [];

        if (assignedTo) {
            customers = await Customer.find({ createdBy: assignedTo }).sort({ createdAt: -1 });
        } else {
            customers = await Customer.find().sort({ createdAt: -1 });
        }

        return res.status(200).json({
            success: true,
            data: customers,
        });
    } catch (err) {
        console.error("Error fetching customers:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
            error: err.message,
        });
    }
};

module.exports = { getCustomerChat, getCustomersByUser }
