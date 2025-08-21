const cloudinary = require("../config/cloudinaryConfig");
const CompanyPayment = require("../models/AccountPaymentWeb");

// GET all payment accounts
const getAllAccounts = async (req, res) => {
  try {
    const payments = await CompanyPayment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    console.error("Get All Accounts Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching payment data" });
  }
};

// GET all accounts by company
const getAccountByCompany = async (req, res) => {
  const { company } = req.query;
  if (!company) {
    return res
      .status(400)
      .json({ success: false, message: "Company is required" });
  }

  try {
    const payments = await CompanyPayment.find({ company }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    console.error("Get Accounts By Company Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching company payments" });
  }
};

// GET single account by ID
const getAccountById = async (req, res) => {
  try {
    const payment = await CompanyPayment.findById(req.params.id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    console.error("Get Account By ID Error:", err);
    res.status(500).json({ success: false, message: "Error fetching payment" });
  }
};

// CREATE a new payment account
const createAccount = async (req, res) => {
  try {
    const { company, name, email, bank, note } = req.body;

    if (!company || !name || !email || !bank || !req.files?.image?.length) {
      return res.status(400).json({
        success: false,
        message: "All fields including image are required",
      });
    }

    const existingAccount = await CompanyPayment.findOne({ company, email });
    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: "Account already exists for this company and email",
      });
    }

    const imageUrl = await uploadBufferToCloudinary(
      req.files.image[0].buffer,
      req.files.image[0].originalname,
      "image"
    );

    const newPayment = new CompanyPayment({
      company,
      name,
      email,
      bank, 
      note,
      image: imageUrl,
    });
    await newPayment.save();

    res.status(201).json({
      success: true,
      message: "Payment account added successfully",
      data: newPayment,
    });
  } catch (err) {
    console.error("Create Account Error:", err);
    res.status(500).json({ success: false, message: "Error saving payment" });
  }
};

// UPDATE payment account by ID
const updateAccount = async (req, res) => {
  try {
    const { company, name, email, bank, note } = req.body;
    const { id } = req.params;

    let updatedFields = { company, name, email, bank, note };

    if (req.files?.image?.length) {
      const imageUrl = await uploadBufferToCloudinary(
        req.files.image[0].buffer,
        req.files.image[0].originalname,
        "image"
      );
      updatedFields.image = imageUrl;
    }

    const updated = await CompanyPayment.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Update Account Error:", err);
    res.status(500).json({ success: false, message: "Error updating payment" });
  }
};

// DELETE payment account by ID
const deleteAccount = async (req, res) => {
  try {
    const deleted = await CompanyPayment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Payment deleted successfully" });
  } catch (err) {
    console.error("Delete Account Error:", err);
    res.status(500).json({ success: false, message: "Error deleting payment" });
  }
};

const uploadBufferToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sales/paymentProofs",
        use_filename: true,
        public_id: originalname.split(".")[0].trim(),
        unique_filename: false,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

module.exports = {
  createAccount,
  deleteAccount,
  updateAccount,
  getAccountById,
  getAccountByCompany,
  getAllAccounts,
};
