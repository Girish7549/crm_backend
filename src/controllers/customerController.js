const Customer = require("../models/Customer");

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, purchasedService, createdBy } = req.body;
    const isExist = await Customer.findOne({ email: email })
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: 'Customer Already Exist'
      })
    }
    let refferCode = `${name.length <= 3 ?
      name.slice(0, 3) + phone.slice(5, 10) :
      name.slice(0, 4) + phone.slice(6, 10)}`.toUpperCase();

    const newCustomer = new Customer({
      name,
      email,
      phone,
      address,
      refferCode,
      purchasedService,
      createdBy,
    });

    await newCustomer.save();
    res.status(200).json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const createRefferedCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, purchasedService, refferedBy, createdBy } = req.body;
    const isExist = await Customer.findOne({ email: email })
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: 'Customer Already Exist'
      })
    }
    let refferCode = `${name.length <= 3 ?
      name.slice(0, 3) + phone.slice(5, 10) :
      name.slice(0, 4) + phone.slice(6, 10)}`.toUpperCase();

    const newCustomer = new Customer({
      name,
      email,
      phone,
      address,
      refferCode,
      refferedBy,
      purchasedService,
      createdBy,
    });

    await newCustomer.save();

    if (refferedBy) {
      await Customer.findByIdAndUpdate(
        refferedBy,
        { $push: { reffers: newCustomer._id } },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (err) {
    console.error("Error in createRefferedCustomer:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.find().populate({
      path: "purchasedService",
      select: "_id name createdAt description",
    });
    res.status(200).json({
      success: true,
      message: "Customer retrived successfully",
      data: customer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getEmpCustomer = async (req, res) => {
  try {
    const employee_ID = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await Customer.countDocuments({ createdBy: employee_ID });

    const customer = await Customer.find({ createdBy: employee_ID })
      .populate({
        path: "purchasedService",
        select: "_id name createdAt description",
      })
      .populate({
        path: "createdBy",
        select: "_id name email role",
      })
      .populate({
        path: "reffers",
        select: "_id name email",
      })
      .populate({
        path: "refferedBy",
        select: "_id name email phone address",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Customer data retrieved by employee",
      data: customer,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const updateData = req.body;
    const customer = await Customer.findByIdAndUpdate(customerId, updateData, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      message: "Customer retrived successfully",
      data: customer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findByIdAndDelete(customerId);
    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: customer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createCustomer,
  createRefferedCustomer,
  getCustomer,
  getEmpCustomer,
  updateCustomer,
  deleteCustomer,
};
