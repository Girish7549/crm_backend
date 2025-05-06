const Callback = require("../models/Callback");
const Controller = require("../models/Callback");
const Notification = require("../models/Notification");

const createCallback = async (req, res) => {
  try {
    const { name, email, phone, address, createdBy, notes, scheduledTime } =
      req.body;
    const newCallback = new Controller({
      name,
      email,
      phone,
      notes,
      address,
      createdBy,
      scheduledTime,
    });
    await newCallback.save();

    res.status(200).json({
      success: true,
      message: "Callback created successfully",
      data: newCallback,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getEmpCallback = async (req, res) => {
  try {
    const empId = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await Callback.countDocuments({ createdBy: empId });

    const callback = await Callback.find({ createdBy: empId })
      .populate("createdBy")
      .limit(limit)
      .skip(skip);

    console.log(empId);
    console.log(callback);

    res.status(200).json({
      success: true,
      message: "Employee Callback Retrived Successfully...",
      data: callback,
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

const updateCallback = async (req, res) => {
  try {
    const callbackId = req.params.id;
    const { notes, scheduledTime, notification: notificationId, status , phone} = req.body;

    const existingCallback = await Callback.findById(callbackId);

    if (!existingCallback) {
      return res.status(404).json({
        success: false,
        message: "Callback not found",
      });
    }

    const updateOps = {};

    // time scheduling kr rha hu 
    if (
      scheduledTime &&
      new Date(scheduledTime).getTime() !== new Date(existingCallback.scheduledTime).getTime()
    ) {
      updateOps.status = status === "notInterested" ? "notInterested" :  "rescheduled";
      updateOps.scheduledTime = scheduledTime;
    }

    // note exist krta h to update kr do aur status ko resheduled kr do
    if (notes && notes.length > 0) {
      await Callback.findByIdAndUpdate(callbackId, {
        $push: { notes: { ...notes[0] } }, 
        ...updateOps,
      }, { new: true, runValidators: true });
    } else {
      await Callback.findByIdAndUpdate(callbackId, updateOps, phone, { new: true, runValidators: true });
    }

    // notification ko delete kr do
    if (notificationId) {
      await Notification.findByIdAndDelete(notificationId);
    }

    const updatedCallback = await Callback.findById(callbackId); 

    res.status(200).json({
      success: true,
      message: "Callback updated successfully",
      data: updatedCallback,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = { createCallback, getEmpCallback, updateCallback };
