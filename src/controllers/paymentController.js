const Payment = require("../models/Payment");
const cloudinary = require("../config/cloudinaryConfig");
const mongoose = require("mongoose");
const Sale = require("../models/Sales");
const Customer = require("../models/Customer"); // assuming this exists

const createPayment = async (req, res) => {
  try {
    const { name, email, phone, paymentId } = req.body;

    if (!req.files?.paymentProof?.length) {
      return res.status(400).json({ error: "paymentProof image is required." });
    }

    const existingPayment = await Payment.findOne({ paymentId });
    if (existingPayment) {
      return res.status(409).json({ error: "Payment ID already exists." });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer found with this email.",
      });
    }

    const sale = await Sale.findOne({ customer: customer._id });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "No sale found for this customer.",
      });
    }

    const uploadedImageUrls = await Promise.all(
      req.files.paymentProof.map((file) =>
        uploadBufferToCloudinary(file.buffer, file.originalname, "image")
      )
    );

    sale.paymentProof.push(uploadedImageUrls[0]);
    await sale.save();

    const payment = new Payment({
      name,
      email,
      phone,
      paymentId,
      paymentProof: uploadedImageUrls[0],
    });
    await payment.save();

    res.status(201).json({
      success: true,
      message: "Payment created and linked to sale.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment Creation Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving payment" });
  }
};

const deletePaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found." });
    }

    // Optional: remove the proof image from Sale.paymentProof array
    const customer = await Customer.findOne({ email: payment.email });
    if (customer) {
      const sale = await Sale.findOne({ customer: customer._id });
      if (sale && sale.paymentProof.includes(payment.paymentProof)) {
        sale.paymentProof = sale.paymentProof.filter(
          (proof) => proof !== payment.paymentProof
        );
        await sale.save();
      }
    }

    // Delete the payment record
    await Payment.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Payment deleted successfully." });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

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

module.exports = { createPayment, getPaymentById, getPayments, deletePaymentById };
