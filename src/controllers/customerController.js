const Customer = require("../models/Customer");
const Sales = require("../models/Sales");
const FollowUp = require("../models/FollowUp");

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, whatsapp, address, purchasedService, createdBy } =
      req.body;
    const isExist = await Customer.findOne({ email: email }).populate("createdBy");
    const isExistInFollowUps = await FollowUp.findOne({ email: email, phone: phone }).populate("salesPerson");
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "Customer Already Exist11111",
        data: isExist
      });
    }
    console.log("CREATED BY :", createdBy)
    console.log("Follow ups saleperson BY :", isExistInFollowUps?.salesPerson._id?.toString())
    if (isExistInFollowUps && createdBy !== isExistInFollowUps?.salesPerson._id?.toString()) {
      return res.status(400).json({
        success: false,
        message: "Customer Already Exist22222",
        data: isExistInFollowUps
      });
    }

    let refferCode = `${
      name.length <= 3
        ? name.slice(0, 3) + phone.slice(5, 10)
        : name.slice(0, 4) + phone.slice(6, 10)
    }`.toUpperCase();

    const newCustomer = new Customer({
      name,
      email,
      phone,
      whatsapp,
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
    const {
      name,
      email,
      phone,
      whatsapp,
      address,
      purchasedService,
      refferedBy,
      createdBy,
    } = req.body;
    const isExist = await Customer.findOne({ email: email });
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "Customer Already Exist",
      });
    }
    let refferCode = `${
      name.length <= 3
        ? name.slice(0, 3) + phone.slice(5, 10)
        : name.slice(0, 4) + phone.slice(6, 10)
    }`.toUpperCase();

    const newCustomer = new Customer({
      name,
      email,
      phone,
      whatsapp,
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
const getEmpCustomerNotSale = async (req, res) => {
  try {
    const employee_ID = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Step 1: Get all customer IDs from sales assigned to this employee
    const sales = await Sales.find({ assignedEmployee: employee_ID }).select(
      "customer"
    );
    const soldCustomerIds = sales.map((sale) => sale.customer.toString());

    // Step 2: Query customers created by employee but not in soldCustomerIds
    const total = await Customer.countDocuments({
      createdBy: employee_ID,
      _id: { $nin: soldCustomerIds },
    });

    const customer = await Customer.find({
      createdBy: employee_ID,
      _id: { $nin: soldCustomerIds },
    })
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
      message: "Customers created by employee without a sale",
      data: customer,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};

const searchCustomer = async (req, res) => {
  try {
    const empId = req.query.empId;
    const query = req.query.query;

    const customers = await Customer.find({
      $and: [
        { createdBy: empId },
        {
          $or: [
            { phone: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Customer Received Successfully....',
      data: customers
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
  getEmpCustomerNotSale,
  getCustomer,
  searchCustomer,
  getEmpCustomer,
  updateCustomer,
  deleteCustomer,
};
