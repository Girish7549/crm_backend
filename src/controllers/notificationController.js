const Callback = require("../models/Callback");
const Notification = require("../models/Notification");

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { title, callback, employee } = req.body;

    const isExist = await Notification.findOne({ callback: callback });
    if (isExist) {
      return;
    }
    const callback_Data = await Callback.findById(callback);

    const newNotification = new Notification({
      title: callback_Data.phone,
      callback,
      employee,
    });

    const savedNotification = await newNotification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: savedNotification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all notifications for a specific employee
const getNotificationsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const notifications = await Notification.find({ employee: employeeId })
      .populate("callback")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createNotification,
  getNotificationsByEmployee,
  deleteNotification,
};
