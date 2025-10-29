const Leads = require("../models/Leads");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

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
        const leads = await Leads.find().populate('generatedBy', 'name email').sort({ createdAt: -1 });
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
        const lead = await Leads.findById(req.params.id).populate('generatedBy', 'name email');

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

const sendFormEmail = async (req, res) => {

    const { SMTP_HOST, SMTP_PORT, SMTP_USER_OTP, SMTP_PASS_OTP } = process.env;

    const { to, link } = req.body;

    try {
        if (!to || !link) {
            return res.status(400).json({
                success: false,
                message: "Recipient email and form link are required.",
            });
        }
        // const emp = await User.findById(userId).populate()

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: true,
            auth: {
                user: SMTP_USER_OTP,
                pass: SMTP_PASS_OTP,
            },
        });

        const mailOptions = {
            from: `"DeemandTV - Sales Team" <${SMTP_USER_OTP}>`,
            to,
            subject: "Please fill out this form",
            html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hello Sir/Ma’am,</h2>
          <p>Your sales executive has shared a form with you.</p>

          <p>
            Please click the button below to fill out your details:
          </p>

          <p>
            <a href="${link}" 
               style="display:inline-block;padding:12px 24px;background:#28a745;
                      color:white;border-radius:6px;text-decoration:none;font-weight:bold;">
              Fill the Form
            </a>
          </p>

          <p>If the button doesn’t work, copy this link and open it in your browser:</p>
          <p><a href="${link}">${link}</a></p>

          <hr/>
          <p>Best regards,<br/>DeemandTV Sales Team</p>
        </div>
      `,
        };

        // 3️⃣ Send email
        await transporter.sendMail(mailOptions);

        // 4️⃣ Return success
        res.status(200).json({
            success: true,
            message: "Form link sent successfully",
        });
    } catch (error) {
        console.error("❌ Error sending form link email:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send form link",
            error: error.message,
        });
    }
};

module.exports = {
    createLeads,
    getAllLeads,
    getLeadsById,
    sendFormEmail,
    getLeadsByGeneratedBy,
    updateLeads,
    deleteLeads
};
