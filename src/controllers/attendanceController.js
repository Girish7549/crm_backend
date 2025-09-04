const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const createAttendence = async (req, res) => {
  const { userId, loginTime, logoutTime, durationSeconds } = req.body;

  if (!userId || !loginTime || !logoutTime || typeof durationSeconds !== "number") {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const status = durationSeconds <= 0 ? "absent" : durationSeconds < 32400 ? "half" : "full";

  try {
    const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000);

    const existingRecord = await Attendance.findOne({
      userId,
      loginTime: { $gte: nineHoursAgo },
    });

    if (existingRecord) {
      await Attendance.deleteOne({ _id: existingRecord._id });
    }

    // 🔹 Mark user offline here
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date()
    });

    const userInfo = await User.findById(userId);
    if (userInfo.role === "admin") return;

    const record = await Attendance.create({
      userId,
      loginTime,
      logoutTime,
      durationSeconds,
      status,
    });

    res.status(201).json({ message: "Attendance recorded", record });
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllAttendence = async (req, res) => {
  try {
    const attendence = await Attendance.find().populate("userId");
    res.status(200).json({
      success: true,
      message: "Employee Attandence",
      data: attendence,
    });
  } catch (err) {
    console.log("Error!", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteAttandence = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteAttandence = await Attendance.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Attendance delete successfully...",
      data: deleteAttandence,
    });
  } catch (err) {
    console.log("Error!", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createAttendence,
  getAllAttendence,
  deleteAttandence,
};
