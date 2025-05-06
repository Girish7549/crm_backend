const Trial = require("../models/Trial");
const User = require("../models/User"); // Assuming you have a User model
const mongoose = require("mongoose");

const createTrial = async (req, res) => {
  try {
    const { email, assignedEmployee } = req.body;

    // Step 1: Check if customer already has a trial
    const isExist = await Trial.findOne({ email });
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "Already Existing Customer",
      });
    }

    // Step 2: Check if employee has a pending trial today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingPendingTrial = await Trial.findOne({
      assignedEmployee,
      status: "pending",
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingPendingTrial) {
      return res.status(400).json({
        success: false,
        message: "Employee already has a pending trial for today",
      });
    }

    // Step 3: Check if employee has trialCount > 0
    const employee = await User.findById(assignedEmployee);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Assigned employee not found",
      });
    }

    if (employee.trialCount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No remaining trial count for this employee",
      });
    }

    // Step 4: Create trial and reduce employee's trialCount
    const newTrial = await Trial.create(req.body);

    employee.trialCount -= 1;
    await employee.save();

    res.status(201).json({
      success: true,
      message: "Trial created successfully",
      data: newTrial,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAllTrials = async (req, res) => {
  try {
    const trials = await Trial.find()
      .populate("service")
      .populate("assignedEmployee");

    res.status(200).json({
      success: true,
      data: trials,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getTrialById = async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id)
      .populate("customer")
      .populate("service")
      .populate("assignedEmployee");

    if (!trial) {
      return res
        .status(404)
        .json({ success: false, message: "Trial not found" });
    }

    res.status(200).json({
      success: true,
      data: trial,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getTrialByTeam = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Team ID",
      });
    }

    const teamObjectId = new mongoose.Types.ObjectId(String(teamId));

    const allAgents = await User.find({ role: "sales_agent" });

    const teamAgents = allAgents.filter((user) =>
      user.team?.equals(teamObjectId)
    );
    const userIds = teamAgents.map((user) => user._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found in this team",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          perPage: 10,
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const preCount = await Trial.countDocuments({
      assignedEmployee: { $in: userIds },
    });

    const pipeline = [
      {
        $match: {
          assignedEmployee: { $in: userIds },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "assignedEmployee",
          foreignField: "_id",
          as: "assignedEmployee",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "assignedEmployee.team",
          foreignField: "_id",
          as: "assignedEmployee.team",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee.team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Trial.aggregate(pipeline);
    // console.log("Aggregated Sales Result:", result);

    const teamTrial = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    if (teamTrial.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No sales found for this team",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trial retrieved based on Team successfully",
      data: teamTrial,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTrialsByEmployeeId = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const trials = await Trial.find({ assignedEmployee: employeeId })
      .populate({ path: "service", select: "_id name description " })
      .populate({ path: "assignedEmployee" });

    // const filteredTrials = trials.filter(
    //   (trial) => trial.customer && trial.customer.status === "trial"
    // );
    if (trials.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No trials found for this employee with customer status 'trial'",
      });
    }

    res.status(200).json({
      success: true,
      data: trials,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateTrial = async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id);

    if (!trial) {
      return res
        .status(404)
        .json({ success: false, message: "Trial not found" });
    }

    // Check if status is being updated from 'pending' to 'active'
    const isStatusChangingToActive =
      trial.status === "pending" && req.body.status === "active";

    if (isStatusChangingToActive) {
      req.body.validation = new Date(Date.now() + 4 * 60 * 1000);
    }

    const updatedTrial = await Trial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Trial updated successfully",
      data: updatedTrial,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteTrial = async (req, res) => {
  try {
    const deletedTrial = await Trial.findByIdAndDelete(req.params.id);

    if (!deletedTrial) {
      return res
        .status(404)
        .json({ success: false, message: "Trial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Trial deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  createTrial,
  getAllTrials,
  getTrialById,
  getTrialByTeam,
  getTrialsByEmployeeId,
  updateTrial,
  deleteTrial,
};
