const TrialActivation = require("../models/TrialActivation");
const Trial = require("../models/Trial");
const Team = require("../models/Team");
const User = require("../models/User");

// Create Trial Activation
const createTrialActivation = async (req, res) => {
  try {
    const {
      trial,
      team,
      assignedEmployee,
      applicationName,
      username,
      password,
      macAddress,
      url,
      notes,
    } = req.body;

    const newActivation = new TrialActivation({
      trial,
      team,
      assignedEmployee,
      applicationName,
      username,
      password,
      macAddress,
      url,
      notes,
    });

    await newActivation.save();

    res.status(201).json({
      success: true,
      message: "Trial activation created successfully",
      data: newActivation,
    });
  } catch (err) {
    console.error("Error creating trial activation:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Trial Activations
const getAllTrialActivations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await TrialActivation.countDocuments();
    const activations = await TrialActivation.find()
      .populate("trial")
      .populate("assignedEmployee")
      // .populate("customer")
      .populate("team")
      .populate("trial")
      // .populate({
      //   path: "trial",
      //   populate: {
      //     path: "customer",
      //     select: "name id email phone address",
      //   },
      // })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Trial activations retrieved successfully",
      data: activations,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching trial activations:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTrialActivationById = async (req, res) => {
  try {
    const activation = await TrialActivation.findById(req.params.id)
      .populate("trial")
      .populate("assignedEmployee")
      .populate("team")
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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllSupportTrialActivation = async (req, res) => {
  try {
    const empId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await TrialActivation.countDocuments({
      assignedEmployee: empId,
    });

    let activation = await TrialActivation.find({ assignedEmployee: empId })
      .populate("assignedEmployee")
      .populate({
        path: "trial",
        // populate: {
        //   path: "customer",
        //   select: "id name email phone address",
        // },
      })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All Trial (Support Emp) Retrived Successfully...",
      data: activation,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching employee Trial activations:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTeamTrialActivation = async (req, res) => {
  try {
    const teamId = req.params.id.trim();
    const team = await Team.findById(teamId);

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await TrialActivation.countDocuments({
      team: teamId,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: `No Team Found On This ID: ${teamId}`,
      });
    }
    const trialActivation = await TrialActivation.find({
      team: teamId,
    })
      .populate("assignedEmployee")
      .populate({
        path: "trial",
        // populate: {
        //   path: "customer",
        //   select: "id name email phone address",
        // },
      })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    // const teamTrialActivation = trialActivation.filter(team => team.team._id == teamId)
    res.status(200).json({
      success: true,
      message: "Team Trial Activation Retrived Successfully...",
      data: trialActivation,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.log("Internal Server Error!!!", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateTrialActivation = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await TrialActivation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Activation not found",
      });
    }

    if (status === "active") {
      await Trial.findByIdAndUpdate(
        updated.trial,
        { status: "active", updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Trial activation updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating trial activation:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteTrialActivation = async (req, res) => {
  try {
    const deleted = await TrialActivation.findByIdAndDelete(req.params.id);

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createTrialActivation,
  getAllTrialActivations,
  getAllSupportTrialActivation,
  getTeamTrialActivation,
  getTrialActivationById,
  updateTrialActivation,
  deleteTrialActivation,
};
