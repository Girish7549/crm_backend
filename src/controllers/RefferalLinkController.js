const ReferralLink = require("../models/ReferralLink");
const { nanoid } = require("nanoid");

// Generate referral link
const generateReferralLink = async (req, res) => {
    try {
        const { customerId, plan, price, margin } = req.body;

        const finalPrice = Number(price) + (margin || 0);

        const linkCode = nanoid(8);

        const referralLink = new ReferralLink({
            customer: customerId,
            plan: plan,
            price,
            margin,
            finalPrice,
            linkCode,
        });

        await referralLink.save();

        res.status(201).json({
            success: true,
            data: {
                id: referralLink._id,
                url: linkCode,
                margin,
                plan,
                finalPrice,
            },
        });
    } catch (err) {
        console.error("Error generating referral link:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Get referral details
const getReferralDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const referral = await ReferralLink.findOne({ linkCode: id })
            .populate("customer");
console.log("REFEREAL INFO : ", referral)
        if (!referral) {
            return res.status(404).json({ success: false, message: "Invalid referral link" });
        }

        res.status(200).json({
            success: true,
            data: referral
        });
    } catch (err) {
        console.error("Error fetching referral:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get all referral links for a customer
const getCustomerReferrals = async (req, res) => {
    try {
        const { id } = req.params;

        const referrals = await ReferralLink.find({ customer: id })
            .populate("customer", "name email phone address");

        res.status(200).json({
            success: true,
            data: referrals,
        });
    } catch (err) {
        console.error("Error fetching customer referrals:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Delete referral link
const deleteReferralLink = async (req, res) => {
    try {
        const { id } = req.params;

        const referral = await ReferralLink.findByIdAndDelete(id);

        if (!referral) {
            return res.status(404).json({
                success: false,
                message: "Referral link not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Referral link deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting referral:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    generateReferralLink,
    getCustomerReferrals,
    getReferralDetails,
    deleteReferralLink,
};


