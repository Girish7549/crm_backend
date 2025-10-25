const Leads = require("../models/Leads");

// 🆕 Create Lead
const createLeads = async (req, res) => {
    try {
        const paymentData = req.body;

        // Optional: Ensure billing details if paymentOption is "Card Payment"
        // if (paymentData.paymentOption === 'Card Payment' && !paymentData.billingDetails) {
        //     return res.status(400).json({ message: 'Billing details are required for Card Payment.' });
        // }

        const newLead = new Leads(paymentData);
        const savedLead = await newLead.save();

        res.status(201).json({
            message: 'Lead created successfully.',
            data: savedLead
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating lead record.',
            error: error.message
        });
    }
};

// 🧾 Get All Leads
const getAllLeads = async (req, res) => {
    try {
        const leads = await Leads.find().sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching leads.',
            error: error.message
        });
    }
};

// 🔍 Get Single Lead by ID
const getLeadsById = async (req, res) => {
    try {
        const lead = await Leads.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching lead.',
            error: error.message
        });
    }
};

// 🎯 Get All Leads by generatedBy (with search + pagination)
const getLeadsByGeneratedBy = async (req, res) => {
    try {
        const { id } = req.params;
        const { search = '', page = 1, limit = 10 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: generatedBy'
            });
        }

        const query = {
            generatedBy: id,
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { paymentOption: { $regex: search, $options: 'i' } },
            ],
        };

        const skip = (page - 1) * limit;
        const total = await Leads.countDocuments(query);
        const leads = await Leads.find(query)
            .populate('generatedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            limit: Number(limit),
            data: leads
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// ✏️ Update Lead (including subscription status)
const updateLeads = async (req, res) => {
    try {
        const updatedLead = await Leads.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        res.status(200).json({
            message: 'Lead updated successfully.',
            data: updatedLead
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating lead.',
            error: error.message
        });
    }
};

// 🗑️ Delete Lead
const deleteLeads = async (req, res) => {
    try {
        const deletedLead = await Leads.findByIdAndDelete(req.params.id);

        if (!deletedLead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        res.status(200).json({
            message: 'Lead deleted successfully.',
            data: deletedLead
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting lead.',
            error: error.message
        });
    }
};

module.exports = {
    createLeads,
    getAllLeads,
    getLeadsById,
    getLeadsByGeneratedBy,
    updateLeads,
    deleteLeads
};
