// const Customer = require("../models/Customer");
// const SaleActivation = require("../models/SaleActivation");

// const createActivation = async (req, res) => {
//   try {
//     const {
//       sale,
//       trial,
//       assignedEmployee,
//       team,
//       applicationName,
//       notes,
//       month,
//       createdBy,
//     } = req.body;

//     if (sale !== "" && trial !== "") {
//       return res.status(401).json({
//         success: false,
//         message: "Sale id & Trial id not accepted at same time",
//       });
//     }

//     const newActivation = new SaleActivation({
//       sale: sale === "" ? null : sale,
//       trial: trial === "" ? null : trial,
//       applicationName,
//       assignedEmployee,
//       team,
//       notes,
//       month,
//       createdBy,
//     });

//     await newActivation.save();

//     res.status(200).json({
//       success: true,
//       message: "Activation created successfully",
//       data: newActivation,
//     });
//   } catch (err) {
//     console.log("Internal server Error", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// // Get all activations
// const getAllActivations = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const skip = (page - 1) * limit;

//     const total = await SaleActivation.countDocuments();
//     const activations = await SaleActivation.find()
//       .populate("sale")
//       .populate("trial")
//       .limit(limit)
//       .skip(skip);

//     res.status(200).json({
//       success: true,
//       message: "All activations retrieved successfully",
//       data: activations,
//       pagination: {
//         totalItems: total,
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         perPage: limit,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching activations:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// const getAllSupportActivation = async (req, res) => {
//   try {
//     const empId = req.params.id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const skip = (page - 1) * limit;

//     const total = await SaleActivation.countDocuments({ assignedEmployee: empId });

//     let activations = await SaleActivation.find({ assignedEmployee: empId })
//       .populate({
//         path: "assignedEmployee",
//         select: "id name email role team assignedService createdAt ",
//       })
//       .populate("sale")
//       .populate("trial")
//       .limit(limit)
//       .skip(skip)
//       .lean();

//     // Conditional population for customer
//     for (let activation of activations) {
//       if (activation.sale && activation.sale.customer) {
//         const customer = await Customer.findById(
//           activation.sale.customer
//         ).select("id name email phone address");
//         activation.sale.customer = customer;
//       } else if (activation.trial && activation.trial.customer) {
//         const customer = await Customer.findById(
//           activation.trial.customer
//         ).select("id name email phone address");
//         activation.trial.customer = customer;
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Employee Activation Retrieved Successfully...",
//       data: activations,
//       pagination: {
//         totalItems: total,
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         perPage: limit,
//       },
//     });
//   } catch (err) {
//     console.log("Error retrieving support activations:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// // Get single activation by ID
// const getActivationById = async (req, res) => {
//   try {
//     const activation = await SaleActivation.findById(req.params.id)
//       .populate("sale")
//       // .populate("trial")
//       .populate("createdBy");

//     if (!activation) {
//       return res.status(404).json({
//         success: false,
//         message: "Activation not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Activation retrieved successfully",
//       data: activation,
//     });
//   } catch (err) {
//     console.error("Error fetching activation by ID:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// // Update activation
// const updateActivation = async (req, res) => {
//   try {
//     const updatedActivation = await SaleActivation.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     updatedActivation.updatedAt = Date.now();

//     if (!updatedActivation) {
//       return res.status(404).json({
//         success: false,
//         message: "Activation not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Activation updated successfully",
//       data: updatedActivation,
//     });
//   } catch (err) {
//     console.error("Error updating activation:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// // Delete activation
// const deleteActivation = async (req, res) => {
//   try {
//     const deleted = await SaleActivation.findByIdAndDelete(req.params.id);

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Activation not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Activation deleted successfully",
//     });
//   } catch (err) {
//     console.error("Error deleting activation:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// module.exports = {
//   createActivation,
//   getAllActivations,
//   getAllSupportActivation,
//   getActivationById,
//   updateActivation,
//   deleteActivation,
// };

const Customer = require("../models/Customer");
const Sale = require("../models/Sales");
const SaleActivation = require("../models/SaleActivation");
const Sales = require("../models/Sales");
const mongoose = require("mongoose");
const User = require("../models/User");
// Create Activation
const createActivation = async (req, res) => {
  try {
    const activation = new SaleActivation(req.body);
    await activation.save();

    const emp = await User.findById(activation.assignedEmployee);

    const io = req.app.get("io");

    io.emit("new-activation", {
      message: "A new activation has been created!",
      teamId: emp.team,
      activationId: activation._id,
    });

    res.status(201).json({
      success: true,
      message: "Activation Sale created successfully",
      data: activation,
    });
  } catch (err) {
    console.error("Error creating activation:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Activations (Paginated)
const getAllActivations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await SaleActivation.countDocuments();
    const activations = await SaleActivation.find()
      .populate("sale")
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
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All activations retrieved",
      data: activations,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const getTeamActivations1 = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await SaleActivation.countDocuments();
    const activations = await SaleActivation.find()
      .populate("sale")
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
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const filtered = activations.filter(
      (activation) =>
        activation.assignedEmployee?.team?._id?.toString() === teamId
    );

    res.status(200).json({
      success: true,
      message: "All activations retrieved",
      data: filtered,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const getTeamActivations = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const allActivations = await SaleActivation.find()
      .populate("sale")
      .populate("customer")
      .populate("assignedEmployee")
      .populate({
        path: "notes",
        populate: {
          path: "employee",
          select: "name email",
        },
      });

    const filtered = allActivations.filter(
      (activation) =>
        activation.assignedEmployee?.team?._id?.toString() === teamId
    );

    const total = filtered.length;

    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
      data: paginated,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getTeamStatusFilterActivations = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();
    const status = req.query.status?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const allActivations = await SaleActivation.find()
      .populate("sale")
      .populate("customer")
      .populate("assignedEmployee")
      .populate({
        path: "notes",
        populate: {
          path: "employee",
          select: "name email",
        },
      });
    console.log("TEAM ID :", teamId);
    console.log("status :", status);
    let filtered;
    if (!teamId || teamId === "null") {
      // No teamId, just filter by status
      filtered = allActivations.filter(
        (activation) => activation.status === status
      );
      console.log("Without Team");
    } else {
      // Filter by both teamId and status
      filtered = allActivations.filter(
        (activation) =>
          activation.assignedEmployee?.team?._id?.toString() === teamId &&
          activation.status === status
      );
      console.log("Along Team");
    }

    const total = filtered.length;

    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
      data: paginated,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Activations by Employee
const getAllSupportActivation = async (req, res) => {
  try {
    const empId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await SaleActivation.countDocuments({
      assignedEmployee: empId,
    });

    let activations = await SaleActivation.find({ assignedEmployee: empId })
      .populate("sale")
      .populate("customer")
      .populate("assignedEmployee")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Employee activations retrieved successfully",
      data: activations,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching employee Sale activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getTeamActivation = async (req, res) => {
  try {
    const teamId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await SaleActivation.countDocuments({
      assignedEmployee: empId,
    });
  } catch (err) {
    console.error("Error fetching activation by ID:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Activation By ID
const getActivationById = async (req, res) => {
  try {
    const activation = await SaleActivation.findById(req.params.id)
      .populate("sale")
      .populate("customer")
      .populate("assignedEmployee")
      .populate("notes.employee");

    if (!activation) {
      return res.status(404).json({
        success: false,
        message: "Activation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activation retrieved successfully",
      data: activation,
    });
  } catch (err) {
    console.error("Error fetching activation by ID:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update Activation

const updateActivation = async (req, res) => {
  try {
    const { notes, ...otherFields } = req.body;

    const updateData = {
      ...otherFields,
      updatedAt: Date.now(),
    };

    // Handle multiple notes (if any)
    if (notes && notes.length > 0) {
      updateData.$push = {
        notes: { $each: notes },
      };
    }

    const updatedActivation = await SaleActivation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedActivation) {
      return res.status(404).json({
        success: false,
        message: "Activation not found",
      });
    }
    const io = req.app.get("io");

    // Emit the update event
    io.emit("activation-updated", {
      message: "Activation updated!",
      activationId: updatedActivation._id,
      status: updatedActivation.status,
      assignedEmployee: updatedActivation.assignedEmployee._id,
    });

    if (req.body.status === "active") {
      await Sales.findByIdAndUpdate(updatedActivation.sale, {
        activation: "done",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activation updated successfully",
      data: updatedActivation,
    });
  } catch (err) {
    console.error("Error updating activation:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// const addMonthInActivation = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const {addMonth} = req.body
//     const activation = await SaleActivation.findById(id);

//     if (!activation) {
//       return res.status(404).json({
//         success: false,
//         message: "Activation not found",
//       });
//     }

//     if (activation.deviceInfo.totalMonths === activation.currentMonth) {
//       return res.status(400).json({
//         success: false,
//         message: "Subscription Over (0 Month Remaining) --> Renew The Subscription",
//       });
//     }

//     //  Add 1 month to expirationDate
//     const currentExpiration = activation.expirationDate || new Date();
//     const newExpiration = new Date(currentExpiration);
//     newExpiration.setMonth(newExpiration.getMonth() + 1);

//     const updatedData = {
//       ...req.body,
//       currentMonth: activation.currentMonth + 1,
//       status: "active",
//       expirationDate: newExpiration,
//       updatedAt: Date.now(),
//     };

//     const updatedActivation = await SaleActivation.findByIdAndUpdate(
//       id,
//       updatedData,
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Month added successfully",
//       data: updatedActivation,
//     });

//   } catch (err) {
//     console.log("Internal Server Error :", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// Delete Activation

const addMonthInActivation = async (req, res) => {
  try {
    const id = req.params.id;
    const { addMonth } = req.body;

    const activation = await SaleActivation.findById(id);

    if (!activation) {
      return res.status(404).json({
        success: false,
        message: "Activation not found",
      });
    }

    // Calculate remaining months
    const remainingMonths =
      activation.deviceInfo.totalMonths - activation.currentMonth;

    if (remainingMonths <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Subscription Over (0 Month Remaining) --> Renew The Subscription",
      });
    }

    if (addMonth > remainingMonths) {
      return res.status(400).json({
        success: false,
        message: `Only ${remainingMonths} months remaining. You can't add more than that.`,
      });
    }

    // Add months to expirationDate
    const currentExpiration = activation.expirationDate || new Date();
    const newExpiration = new Date(currentExpiration);
    newExpiration.setMonth(newExpiration.getMonth() + addMonth);

    // Update directly on the document
    activation.currentMonth += addMonth;
    activation.expirationDate = newExpiration;
    activation.status = "active";
    activation.updatedAt = Date.now();

    await activation.save();

    res.status(200).json({
      success: true,
      message: `${addMonth} Month(s) added successfully`,
      data: activation,
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteActivation = async (req, res) => {
  try {
    const deleted = await SaleActivation.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Activation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activation deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting activation:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchActivationsByPhone = async (req, res) => {
  try {
    const { number, page = 1, limit = 10 } = req.query;

    // Step 1: Find the customers whose phone number matches the given query
    const customers = await Customer.find({
      phone: { $regex: number, $options: 'i' } // Case-insensitive regex search for partial phone number
    }).select('_id'); // We only need the _id field

    // Step 2: If no customers are found, return an error message
    if (customers.length === 0) {
      return res.status(404).json({ message: 'No customers found with that phone number.' });
    }

    // Step 3: Extract the customer IDs from the result and convert to ObjectId format
    const customerIds = customers.map(customer => mongoose.Types.ObjectId(customer._id));

    // Step 4: Query the Activation model to get activations associated with these customers
    const activations = await SaleActivation.find({
      customer: { $in: customerIds }
    })
      .skip((page - 1) * limit) // Apply pagination: (page - 1) * limit
      .limit(parseInt(limit)) // Limit the number of results per page
      .populate('sale') // Populate the Sale reference (optional, if needed)
      .populate('assignedEmployee') // Populate the assignedEmployee reference (optional, if needed)
      .exec();

    // Step 5: Return the matching activations
    return res.json(activations);
  } catch (error) {
    console.error('Error fetching activations by phone number:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



module.exports = {
  createActivation,
  getAllActivations,
  getTeamActivations,
  getTeamStatusFilterActivations,
  searchActivationsByPhone,
  getAllSupportActivation,
  addMonthInActivation,
  getActivationById,
  updateActivation,
  deleteActivation,
};
