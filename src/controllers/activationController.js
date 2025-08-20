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

const Sale = require("../models/Sales");
const SaleActivation = require("../models/SaleActivation");
const Sales = require("../models/Sales");
const mongoose = require("mongoose");
const User = require("../models/User");
const Customer = require("../models/Customer");
// const SaleActivation = require("../models/SaleActivation");
// Create Activation
const createActivationOld = async (req, res) => {
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
const createActivation = async (req, res) => {
  try {
    const {
      sale: saleId,
      customer,
      deviceInfo,
      assignedEmployee,
      applicationName,
      notes,
    } = req.body;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    const createdDate = new Date(sale.createdAt);
    const today = new Date();

    // Normalize both to compare just the date (not time)
    const isBeforeToday =
      createdDate.toDateString() !== today.toDateString() &&
      createdDate.getTime() < today.getTime();

    const activationData = {
      sale: saleId,
      customer,
      deviceInfo,
      applicationName,
      notes,
      assignedEmployee,
    };

    if (isBeforeToday) {
      let monthsPassed =
        (today.getFullYear() - createdDate.getFullYear()) * 12 +
        (today.getMonth() - createdDate.getMonth());

      if (today.getDate() >= createdDate.getDate()) {
        monthsPassed += 1;
      }

      const totalMonths = deviceInfo?.totalMonths || 1;
      const currentMonth = Math.min(monthsPassed, totalMonths);

      const expirationDate = new Date(createdDate);
      expirationDate.setMonth(expirationDate.getMonth() + currentMonth);

      activationData.currentMonth = currentMonth;
      activationData.expirationDate = expirationDate;
      activationData.status = "active"; // Set active only if sale is in the past
    }

    const activation = new SaleActivation(activationData);
    await activation.save();

    await Sales.updateOne(
      { _id: saleId },
      {
        $set: {
          "saleItems.$[].devices.$[].new": false,
        },
      }
    );

    const emp = await User.findById(assignedEmployee);
    const io = req.app.get("io");

    const support = await User.findById(assignedEmployee).populate(
      "name email role team"
    );

    const employee = await User.findById(sale.assignedEmployee).populate(
      "name email role team"
    );

    const customerInfo = await Customer.findById(customer).populate(
      "name email phone"
    );

    console.log("Sale Executive :", employee.name);
    console.log("Support :", support.name);

    io.emit("new-activation", {
      message: "A new activation has been created!",
      teamId: emp.team,
      assignedEmployee: employee,
      support,
      customerInfo,
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

    const serviceId = req.query.serviceId?.trim(); // Changed to query param
    const teamId = req.query.teamId?.trim(); // Optional team filter
    const role = req.query.role || "support"; // Optional, default role = support

    console.log("🔍 Filtering by:");
    console.log("Service ID:", serviceId);
    console.log("Team ID:", teamId);
    console.log("Role:", role);
    
    // Build user filter
    const userFilter = {};
    if (serviceId) userFilter.assignedService = serviceId;
    if (teamId) userFilter.team = teamId;
    if (role) userFilter.role = role;

    const users = await User.find(userFilter).select("_id");
    const employeeIds = users.map((u) => u._id);
    console.log("employeeIds:", employeeIds);

    
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found for given filters",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit,
        },
      });
    }

    const filter = {
      assignedEmployee: { $in: employeeIds },
    };

    const total = await SaleActivation.countDocuments(filter);

    const activations = await SaleActivation.find(filter)
      .populate("customer")
      .populate({
        path: "assignedEmployee",
        populate: [
          { path: "team", select: "name" },
          { path: "assignedService", select: "name" },
        ],
      })
      .populate({
        path: "notes",
        populate: {
          path: "employee",
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
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
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

// const getAllActivations = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const skip = (page - 1) * limit;

//     const assignedService = req.params.id;
//     console.log("Company :", assignedService);

//     const filter = {};

//     if (assignedService) {
//       // ✅ Use correct field name (assignedService)
//       const employeesWithService = await User.find({
//         assignedService: assignedService,
//       }).select("_id");

//       const employeeIds = employeesWithService.map((emp) => emp._id);
//       console.log("Extract Employee Id :", employeeIds);

//       filter.assignedEmployee = { $in: employeeIds };
//     }

//     const total = await SaleActivation.countDocuments(filter);

//     const activations = await SaleActivation.find(filter)
//       .populate("customer")
//       .populate({
//         path: "assignedEmployee",
//         populate: {
//           path: "assignedService", // ✅ Also corrected here
//         },
//       })
//       .populate({
//         path: "notes",
//         populate: {
//           path: "employee",
//           model: "User",
//           select: "name email",
//         },
//       })
//       .populate({
//         path: "sale",
//         populate: {
//           path: "assignedEmployee",
//           select: "name email",
//         },
//       })
//       .limit(limit)
//       .skip(skip)
//       .sort({ createdAt: -1 });

//     console.log("Activations Employee :", activations);

//     res.status(200).json({
//       success: true,
//       message: "Filtered activations retrieved",
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
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

const getAllActivations_Old = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await SaleActivation.countDocuments();
    const activations = await SaleActivation.find()
      // .populate("sale")
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
const getTeamActivations_working = async (req, res) => {
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
const getTeamActivations = async (req, res) => {
  try {
    const teamId = req.params.teamId?.trim();
    const serviceId = req.params.serviceId?.trim();
    console.log("*********** Team id :", teamId);
    console.log("*********** Service id :", serviceId);

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Step 1: Find users that match both the team and assignedService
    const matchingUsers = await User.find({
      team: teamId,
      role: "support",
      assignedService: serviceId,
    }).select("_id");

    const employeeIds = matchingUsers.map((user) => user._id);
    console.log("*********** Matching Users id :", matchingUsers);

    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found for given team and service",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit,
        },
      });
    }

    // Step 2: Query activations assigned to those employees
    const total = await SaleActivation.countDocuments({
      assignedEmployee: { $in: employeeIds },
    });

    const activations = await SaleActivation.find({
      assignedEmployee: { $in: employeeIds },
    })
      .populate("customer")
      .populate({
        path: "assignedEmployee",
        populate: [
          { path: "team", select: "name" },
          { path: "assignedService", select: "name" },
        ],
      })
      .populate({
        path: "notes",
        populate: {
          path: "employee",
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
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
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

const getTeamStatusFilterActivations_old_working = async (req, res) => {
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
const getTeamStatusFilterActivations = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();
    const status = req.query.status?.trim();
    const serviceId = req.query.serviceId?.trim();
    const role = "support";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const userFilter = {};
    if (teamId && teamId !== "null") userFilter.team = teamId;
    if (serviceId) userFilter.assignedService = serviceId;
    if (role) userFilter.role = role;

    const users = await User.find(userFilter).select("_id");
    const employeeIds = users.map((u) => u._id);

    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No matching users found",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit,
        },
      });
    }

    const activationFilter = {
      assignedEmployee: { $in: employeeIds },
    };
    if (status) activationFilter.status = status;

    const total = await SaleActivation.countDocuments(activationFilter);

    const activations = await SaleActivation.find(activationFilter)
      .populate("customer")
      .populate({
        path: "assignedEmployee",
        populate: [
          { path: "team", select: "name" },
          { path: "assignedService", select: "name" },
        ],
      })
      .populate({
        path: "notes",
        populate: {
          path: "employee",
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
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
      data: activations,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching filtered activations:", err);
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
        status: "done",
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

const renewActivation = async (req, res) => {
  try {
    const { id } = req.params;

    const renewalDate = new Date();
    const newExpirationDate = new Date();
    newExpirationDate.setMonth(renewalDate.getMonth() + 1);

    const updatedActivation = await Activation.findByIdAndUpdate(
      id,
      {
        currentMonth: 1,
        expirationDate: newExpirationDate,
        status: "active",
        updatedAt: renewalDate,
      },
      { new: true }
    ).populate("assignedEmployee customer sale");

    if (!updatedActivation) {
      return res.status(404).json({ message: "Activation not found" });
    }

    return res.status(200).json({
      message: "Activation renewed successfully",
      activation: updatedActivation,
    });
  } catch (error) {
    console.error("Error renewing activation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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
const oldSaleUpdate1 = async (req, res) => {
  try {
    const id = req.params.id;
    const { oldDate } = req.body;

    console.log("OLD DATE (input):", oldDate);

    // Validate oldDate
    const createdDate = new Date(oldDate);
    if (isNaN(createdDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid oldDate format. Please provide a valid date.",
      });
    }

    const saleActivation = await SaleActivation.findById(id);
    if (!saleActivation) {
      return res.status(404).json({
        success: false,
        message: "Sale Activation not found",
      });
    }

    const currentDate = new Date();

    const passedMonths =
      (currentDate.getFullYear() - createdDate.getFullYear()) * 12 +
      (currentDate.getMonth() - createdDate.getMonth());

    console.log("Passed months:", passedMonths);

    const remainingMonths = Math.max(
      saleActivation.deviceInfo.totalMonths - passedMonths,
      0
    );

    console.log("Remaining months:", remainingMonths);

    const newExpirationDate = new Date(createdDate);
    newExpirationDate.setMonth(newExpirationDate.getMonth() + remainingMonths);

    if (isNaN(newExpirationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Failed to calculate valid expiration date",
      });
    }

    saleActivation.createdAt = createdDate;
    saleActivation.deviceInfo.totalMonths = remainingMonths;
    saleActivation.expirationDate = newExpirationDate;

    await saleActivation.save();

    res.json({
      success: true,
      message: "Sale Activation updated successfully",
      data: saleActivation,
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const oldSaleUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    const { oldDate } = req.body;

    const saleActivation = await SaleActivation.findById(id);
    if (!saleActivation) {
      return res.status(404).json({
        success: false,
        message: "Sale Activation not found",
      });
    }

    const createdDate = new Date(oldDate);
    const currentDate = new Date();

    // Calculate months passed
    // How many full months have passed since oldDate
    const passedMonths =
      (currentDate.getFullYear() - createdDate.getFullYear()) * 12 +
      (currentDate.getMonth() - createdDate.getMonth());

    const currentMonth = Math.min(
      passedMonths + 1,
      saleActivation.deviceInfo.totalMonths
    );

    // New expiration date: just 1 month ahead of createdDate
    const newExpirationDate = new Date(createdDate);
    newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);

    // Update fields
    saleActivation.createdAt = createdDate;
    saleActivation.currentMonth = currentMonth;
    saleActivation.expirationDate = newExpirationDate;

    await saleActivation.save();

    res.json({
      success: true,
      message: "Sale Activation updated successfully",
      data: saleActivation,
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

const searchActivations_working  = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const query = req.query.query;
    const limit = 10;
    // const { number } = req.params.id;

    const customers = await Customer.find({
      $or: [
        { phone: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    });
    if (customers.length === 0) {
      return res
        .status(404)
        .json({ message: "No customers found with that phone number." });
    }

    const customerIds = customers.map((customer) => customer._id);

    const activations = await SaleActivation.find({
      customer: { $in: customerIds },
    })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: "sale",
        populate: {
          path: "assignedEmployee",
        },
      })
      .populate("customer")
      .populate("assignedEmployee")
      .populate({
        path: "notes",
        populate: {
          path: "employee",
          model: "User",
          select: "name email",
        },
      });

    // return res.json(activations);
    return res.status(200).json({
      success: true,
      message: "Activation retrieved successfully",
      data: activations,
    });
  } catch (error) {
    console.error("Error fetching activations by phone number:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const searchActivations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = req.query.query?.trim();
    const teamId = req.query.teamId?.trim();
    const serviceId = req.query.serviceId?.trim();
    const role = "support"; // optional

    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    // Step 1: Find matching customers
    const customers = await Customer.find({
      $or: [
        { phone: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    });

    if (customers.length === 0) {
      return res.status(404).json({ message: "No customers found with that query." });
    }

    const customerIds = customers.map((customer) => customer._id);

    // Step 2: Find employees matching team/service/role filters
    const userFilter = {};
    if (teamId) userFilter.team = teamId;
    if (serviceId) userFilter.assignedService = serviceId;
    if (role) userFilter.role = role;

    const matchedUsers = await User.find(userFilter).select("_id");
    const employeeIds = matchedUsers.map((u) => u._id);

    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No employees found matching team/service filters.",
        data: [],
      });
    }

    // Step 3: Search activations with both filters
    const filter = {
      customer: { $in: customerIds },
      assignedEmployee: { $in: employeeIds },
    };

    const total = await SaleActivation.countDocuments(filter);

    const activations = await SaleActivation.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("customer")
      .populate({
        path: "assignedEmployee",
        populate: [
          { path: "team", select: "name" },
          { path: "assignedService", select: "name" },
        ],
      })
      .populate({
        path: "sale",
        populate: {
          path: "assignedEmployee",
          select: "name email",
        },
      })
      .populate({
        path: "notes",
        populate: {
          path: "employee",
          model: "User",
          select: "name email",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Filtered activations retrieved successfully",
      data: activations,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching activations by query:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  createActivation,
  getAllActivations,
  getTeamActivations,
  getTeamStatusFilterActivations,
  searchActivations,
  oldSaleUpdate,
  getAllSupportActivation,
  addMonthInActivation,
  renewActivation,
  getActivationById,
  updateActivation,
  deleteActivation,
};
