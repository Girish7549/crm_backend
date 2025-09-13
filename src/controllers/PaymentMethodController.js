const PaymentMethod = require('../models/PaymentMethod');

// CREATE a new payment method
const createPaymentMethod = async (req, res) => {
    try {
        const { company, name } = req.body;

        if (!company || !name) {
            return res.status(400).json({ message: 'Company and name are required' });
        }

        const newPaymentMethod = new PaymentMethod({ company, name });
        const saved = await newPaymentMethod.save();

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: 'Error creating payment method', error });
    }
};

// GET all payment methods
const getAllPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 });
        res.status(200).json(paymentMethods);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payment methods', error });
    }
};

// GET a single payment method by ID
const getPaymentMethodById = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentMethod = await PaymentMethod.findById(id);

        if (!paymentMethod) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        res.status(200).json(paymentMethod);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payment method', error });
    }
};

const getPaymentMethodsByCompanyId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    const paymentMethods = await PaymentMethod.find({ company: id })
      .populate('company', 'name') // optional: populate company name from Service model
      .sort({ createdAt: -1 });

    res.status(200).json({ data: paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods by company ID:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE a payment method by ID
const updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const { company, name } = req.body;

        const updated = await PaymentMethod.findByIdAndUpdate(
            id,
            { company, name },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment method', error });
    }
};

// DELETE a payment method by ID
const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PaymentMethod.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        res.status(200).json({ message: 'Payment method deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting payment method', error });
    }
};

module.exports = { createPaymentMethod, getAllPaymentMethods, getPaymentMethodById, getPaymentMethodsByCompanyId, updatePaymentMethod, deletePaymentMethod }