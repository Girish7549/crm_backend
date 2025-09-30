const Referral = require("../models/Refferal");

const createReferral = async (req, res) => {
    try {
        const { name, email, phone, address, plan, customer, commission } = req.body;

        const referral = new Referral({
            name,
            email,
            phone,
            address,
            plan,
            customer,
            commission,
        });

        await referral.save();

        res.status(201).json({
            success: true,
            message: "Referral created successfully",
            data: referral,
        });
    } catch (err) {
        console.error("Error creating referral:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find().populate("customer", "name email phone");
        res.status(200).json({ success: true, data: referrals });
    } catch (err) {
        console.error("Error fetching referrals:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getReferralsByCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const referrals = await Referral.find({ customer: id }).populate("customer", "name email phone");

        res.status(200).json({
            success: true,
            data: referrals,
        });
    } catch (err) {
        console.error("Error fetching referrals by customer:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getReferral = async (req, res) => {
    try {
        const { id } = req.params;
        const referral = await Referral.findById(id).populate("customer", "name email phone");

        if (!referral) {
            return res.status(404).json({ success: false, message: "Referral not found" });
        }

        res.status(200).json({ success: true, data: referral });
    } catch (err) {
        console.error("Error fetching referral:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateReferral = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const referral = await Referral.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!referral) {
            return res.status(404).json({ success: false, message: "Referral not found" });
        }

        res.status(200).json({ success: true, message: "Referral updated", data: referral });
    } catch (err) {
        console.error("Error updating referral:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteReferral = async (req, res) => {
    try {
        const { id } = req.params;
        const referral = await Referral.findByIdAndDelete(id);

        if (!referral) {
            return res.status(404).json({ success: false, message: "Referral not found" });
        }

        res.status(200).json({ success: true, message: "Referral deleted" });
    } catch (err) {
        console.error("Error deleting referral:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const markReferralPaid = async (req, res) => {
    try {
        const { id } = req.params;

        const referral = await Referral.findByIdAndUpdate(
            id,
            { status: "paid" },
            { new: true }
        );

        if (!referral) {
            return res.status(404).json({ success: false, message: "Referral not found" });
        }

        res.status(200).json({
            success: true,
            message: "Referral marked as paid",
            data: referral,
        });
    } catch (err) {
        console.error("Error marking referral as paid:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { createReferral, getReferrals, getReferralsByCustomer, getReferral, updateReferral, deleteReferral, markReferralPaid }