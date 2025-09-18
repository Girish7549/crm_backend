const Invoice = require("../models/Invoice");
const cloudinary = require("../config/cloudinaryConfig");

// ===== CREATE Invoice with Logo Upload =====
const createInvoice = async (req, res) => {
    try {
        const { company, email } = req.body;

        if (!company || !email) {
            return res
                .status(400)
                .json({ success: false, message: "Company and email are required" });
        }

        let logoUrl = null;
        console.log("LOGO HERE **************", req.files?.logo)

        // ⬇️ Step 1: Upload logo if provided
        if (req.files?.logo?.length > 0) {
            const uploadedLogo = await uploadBufferToCloudinary(
                req.files.logo[0].buffer,
                req.files.logo[0].originalname,
                "image"
            );
            logoUrl = uploadedLogo;
        }

        // ⬇️ Step 2: Create invoice
        const invoice = new Invoice({
            company,
            email,
            logo: logoUrl,
        });

        await invoice.save();

        res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: invoice,
        });
    } catch (err) {
        console.error("Create Invoice Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};

// Upload function supporting both image & audio
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: type === "audio" ? "sales/voiceNotes" : "sales/paymentProofs",
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

// ===== GET All Invoices =====
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate("company", "name");
        res.status(200).json({ success: true, data: invoices });
    } catch (err) {
        console.error("Get Invoices Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ===== GET Invoice by ID =====
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate("company", "name");
        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }
        res.status(200).json({ success: true, data: invoice });
    } catch (err) {
        console.error("Get Invoice Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ===== GET Invoices by Company =====
const getInvoicesByCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const invoices = await Invoice.find({ company: id }).populate("company");
        res.status(200).json({ success: true, data: invoices });
    } catch (err) {
        console.error("Get Invoices By Company Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ===== UPDATE Invoice =====
const updateInvoice = async (req, res) => {
    try {
        const { company, email, existingLogo } = req.body;
        const updateData = {};

        // Only set fields if provided
        if (company) updateData.company = company;
        if (email) updateData.email = email;

        console.log("Company : ", company)
        console.log("Email : ", email)

        // If new file uploaded
        if (req.files?.logo?.length > 0) {
            const uploadedLogo = await uploadBufferToCloudinary(
                req.files.logo[0].buffer,
                req.files.logo[0].originalname,
                "image"
            );
            updateData.logo = uploadedLogo;
        }
        // If no new file but existing logo provided
        else if (existingLogo) {
            updateData.logo = existingLogo;
        }

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        res.json({ success: true, data: invoice });
    } catch (err) {
        console.error("Update Invoice Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};



// ===== DELETE Invoice =====
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByIdAndDelete(id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        res.status(200).json({ success: true, message: "Invoice deleted successfully" });
    } catch (err) {
        console.error("Delete Invoice Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = { createInvoice, getInvoices, getInvoiceById, getInvoicesByCompany, updateInvoice, deleteInvoice }
