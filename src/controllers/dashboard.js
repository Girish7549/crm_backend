const mongoose = require("mongoose");
const SaleActivation = require("../models/SaleActivation");
const TrialActivation = require("../models/TrialActivation");
const Sales = require("../models/Sales");
const Trial = require("../models/Trial");
const FollowUp = require("../models/FollowUp");
const Callback = require("../models/Callback");

const getActivationDashboard = async (req, res) => {
  try {
    const all_Sale_Activation = await SaleActivation.find();
    const all_Trial_Activation = await TrialActivation.find();
    const sale_live_count = all_Sale_Activation.filter(
      (item) => item.status === "active"
    );
    const sale_pending_count = all_Sale_Activation.filter(
      (item) => item.status === "pending"
    );
    const sale_expiredSoon_count = all_Sale_Activation.filter(
      (item) => item.status === "expired-soon"
    );
    const trial_live_count = all_Trial_Activation.filter(
      (item) => item.status === "active"
    );
    const trial_pending_count = all_Trial_Activation.filter(
      (item) => item.status === "pending"
    );
    const trial_expiredSoon_count = all_Trial_Activation.filter(
      (item) => item.status === "expired-soon"
    );
    let responseData = {
      trial_expiredSoon_count: trial_expiredSoon_count.length,
      trial_pending_count: trial_pending_count.length,
      trial_live_count: trial_live_count.length,
      sale_expiredSoon_count: sale_expiredSoon_count.length,
      sale_pending_count: sale_pending_count.length,
      sale_live_count: sale_live_count.length,
    };
    res.status(200).json({
      success: true,
      message: "Dashboard Data Reterived",
      data: responseData,
    });
  } catch (err) {
    console.log("Internal Server Error !");
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

const getSaleDashboard = async (req, res) => {
  try {
    const empId = req.params.id;
    const all_Sale = await Sales.find({ assignedEmployee: empId });
    const all_Trial = await Trial.find({ assignedEmployee: empId });
    const all_FollowUps = await FollowUp.find({ salesPerson: empId });
    const all_Callback = await Callback.find({ createdBy: empId });

    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthly_sale = all_Sale.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    });
    const pending_payment = all_Sale
      .filter((item) => item.status === "pending")
      .reduce((total, item) => total + (item.totalAmount || 0), 0);

    const follow_ups_today = all_FollowUps.length;
    const callback_today = all_Callback.filter((item) => {
      const scheduledTime = new Date(item.scheduledTime);
      return (
        scheduledTime.getDate() === currentDate &&
        scheduledTime.getMonth() === currentMonth &&
        scheduledTime.getFullYear() === currentYear
      );
    });
    const trial_pending = all_Trial.filter((item) => item.status === "pending");
    // const trial_expiredSoon_count = all_Trial.filter(
    //   (item) => item.status === "expired-soon"
    // );
    let responseData = {
      monthly_sale : monthly_sale.length,
      pending_payment : pending_payment,
      follow_ups_today : follow_ups_today,
      callback_today : callback_today.length,
      trial_pending : trial_pending.length,
    };
    res.status(200).json({
      success: true,
      message: "Dashboard Data Reterived",
      data: responseData,
    });
  } catch (err) {
    console.log("Internal Server Error !");
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

module.exports = { getActivationDashboard, getSaleDashboard };
