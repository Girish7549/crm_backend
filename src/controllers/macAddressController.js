const MacAddress = require("../models/MacAddress");
const SaleActivation = require("../models/SaleActivation");

// Create new MAC Address
const createMacAddress = async (req, res) => {
  try {
    const { macAddress } = req.body;

    if (!macAddress) {
      return res.status(400).json({
        success: false,
        message: "macAddress is required",
      });
    }

    const existing = await MacAddress.findOne({ macAddress: macAddress });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Existed MacAddress ",
      });
    }

    const newMac = new MacAddress({ macAddress });
    const savedMac = await newMac.save();

    res.status(201).json({
      success: true,
      message: "MAC address created successfully",
      data: savedMac,
    });
  } catch (err) {
    console.error("Error creating MAC address:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//  Get all MAC Addresses
const getAllMacAddresses = async (req, res) => {
  try {
    const macs = await MacAddress.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: macs,
    });
  } catch (err) {
    console.error("Error fetching MAC addresses:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const checkMacExists = async (req, res) => {
  try {
    const { macAddress } = req.query;
    console.log("MacAddress: ", macAddress);
    const existing = await MacAddress.findOne({ macAddress: macAddress });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Existed MacAddress ",
      });
    }
    res.status(200).json({
      success: true,
      message: "Passed Unique MacAddress ",
    });
    // res.json({ exists: !!existing });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get single MAC Address by ID
const getMacAddressById = async (req, res) => {
  try {
    const id = req.params.id;
    const mac = await MacAddress.findById(id);

    if (!mac) {
      return res.status(404).json({
        success: false,
        message: "MAC address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: mac,
    });
  } catch (err) {
    console.error("Error fetching MAC address:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update MAC Address
const updateMacAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const { macAddress } = req.body;

    const updated = await MacAddress.findByIdAndUpdate(
      id,
      { macAddress },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "MAC address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "MAC address updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating MAC address:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete MAC Address
const deleteMacAddress = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await MacAddress.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "MAC address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "MAC address deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting MAC address:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const emptyMacAddress = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // const total = await SaleActivation.countDocuments();

    const emptyMacAddress = await SaleActivation.find({ macAddress: null })
      .populate("customer")
      .populate("assignedEmployee")
      .populate({
        path: "notes",
        populate: {
          path: "employee",
          model: "User",
          select: "name email",
        },
      })
      .populate({
        path: "sale",
        populate: {
          path: "assignedEmployee",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    const total = emptyMacAddress.length;

    res.status(200).json({
      success: true,
      message: "All Empty Mac Address Received...",
      data: emptyMacAddress,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error Find Empty MAC address:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createMacAddress,
  getAllMacAddresses,
  checkMacExists,
  emptyMacAddress,
  getMacAddressById,
  updateMacAddress,
  deleteMacAddress,
};
