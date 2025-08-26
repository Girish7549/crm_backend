const bcrypt = require("bcryptjs");
const User = require("../models/User");

require("dotenv").config();

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedService, team } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("password :", password);
    console.log("hashedPassword :", hashedPassword);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      originalPassword: password,
      role,
      assignedService,
      team,
    });
    await newUser.save();
    res.status(200).json({
      success: true,
      message: `User Created Successfully`,
      data: newUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const searchUser = async (req, res) => {
  try {
    const query = req.params.id?.trim();

    const pipeline = [
      {
        $match: {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      },
    ];

    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).populate("team")
      .populate("assignedService");
      
    res.status(200).json({
      success: true,
      message: "Search User Retrived Successfully",
      data: user,
    });
  } catch (err) {
    console.log("Error!", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error !",
    });
  }
};
const getAllUser = async (req, res) => {
  try {
    const users = await User.find()
      .populate({
        path: "assignedService",
        populate: { path: "manager" },
      })
      .populate("team");
    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const users = await User.findById(userId).populate({
      path: "assignedService",
      populate: { path: "manager" },
    });
    if (!users) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const updateUser1 = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    updateData.password = hashedPassword;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body };

    // Only hash password if it's provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const users = await User.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: "User delete successfully",
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createUser,
  getAllUser,
  getUser,
  updateUser,
  deleteUser,
  searchUser,
};
