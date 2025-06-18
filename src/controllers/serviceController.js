const Service = require("../models/Service");

require("dotenv").config();

const createService = async (req, res) => {
  try {
    const { name, description, revenue, profit, manager } = req.body;

    const newService = new Service({
      name,
      description,
      revenue,
      profit,
      manager,
    });
    await newService.save();
    res.status(200).json({
      success: true,
      message: `User Created Successfully`,
      data: newService,
    });
  } catch (err) {
    console.log(err);
  }
};
const getService = async (req, res) => {
  try {
    const services = await Service.find().populate({
      path: "manager",
      select: "_id name email role createdAt",
    });
    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, revenue, profit, manager } = req.body;

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { name, description, revenue, profit, manager },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteService = await Service.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Service delete successfully...",
      data: deleteService,
    });
  } catch (err) {
    console.log("Error!", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { createService, getService, updateService, deleteService };
