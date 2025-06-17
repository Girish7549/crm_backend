const mongoose = require("mongoose");
const SaleActivation = require("../models/SaleActivation");
const TrialActivation = require("../models/TrialActivation");
const Sales = require("../models/Sales");
const Trial = require("../models/Trial");
const FollowUp = require("../models/FollowUp");
const Callback = require("../models/Callback");
const Service = require("../models/Service");
// const Activation = require("../models/Activation");
const User = require("../models/User");

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
      monthly_sale: monthly_sale.length,
      pending_payment: pending_payment,
      follow_ups_today: follow_ups_today,
      callback_today: callback_today.length,
      trial_pending: trial_pending.length,
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

const getAdminDashboard_old = async (req, res) => {
  try {
    const services = await Service.find().populate("manager", "name");

    const dashboardData = await Promise.all(
      services.map(async (service) => {
        const sales = await Sales.find({ service: service._id });

        const totalRevenue = sales.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        );
        const totalSales = sales.length;

        const customerIds = new Set(
          sales.map((sale) => sale.customer?.toString())
        );
        const pending = sales.filter((s) => s.status === "pending").length;
        const expiring = 0; 

        return {
          name: service.name,
          revenue: totalRevenue,
          sales: totalSales,
          customers: customerIds.size,
          pending,
          expiring,
          description: service.description || "",
          manager: {
            label: service.manager?.name || "Unassigned",
            value: service.manager?._id?.toString() || "",
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (err) {
    console.error("Internal Server Error!", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const services = await Service.find().populate("manager", "name");

    const allSales = await Sales.find()
      .populate("assignedEmployee", "name")
      .populate("service", "name")
      .populate("customer", "name");

    const allActivations = await SaleActivation.find()
      .populate("customer", "name")
      .populate({
        path: "sale",
        populate: {
          path: "service",
          select: "name",
        },
      });

    const allUsers = await User.find().populate("assignedService");

    // 1. Dashboard Summary per Service
    const dashboardData = await Promise.all(
      services.map(async (service) => {
        const sales = allSales.filter(
          (sale) => sale.service?._id.toString() === service._id.toString()
        );

        const totalRevenue = sales.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        );
        const totalSales = sales.length;
        const customerIds = new Set(
          sales.map((sale) => sale.customer?._id?.toString())
        );
        const pending = sales.filter((s) => s.status === "pending").length;

        const expiring = allActivations.filter((a) => {
          const s = a.sale?.service;
          if (
            !s ||
            !a.expirationDate ||
            s._id.toString() !== service._id.toString()
          )
            return false;
          const diff =
            (new Date(a.expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 7;
        }).length;

        return {
          name: service.name,
          revenue: totalRevenue,
          sales: totalSales,
          customers: customerIds.size,
          pending,
          expiring,
          description: service.description || "",
          manager: {
            label: service.manager?.name || "Unassigned",
            value: service.manager?._id?.toString() || "",
          },
        };
      })
    );

    // 2. Top 5 Sales Employees Leaderboard
    const employeeMap = new Map();

    for (const sale of allSales) {
      if (!sale.assignedEmployee) continue;

      const key = sale.assignedEmployee._id.toString();
      const existing = employeeMap.get(key) || {
        id: key,
        name: sale.assignedEmployee.name,
        service: sale.service?.name || "Unknown",
        totalSales: 0,
        revenue: 0,
      };

      existing.totalSales += 1;
      existing.revenue += sale.totalAmount || 0;

      employeeMap.set(key, existing);
    }

    const salesLeaderboardData = Array.from(employeeMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 3. Expiring Subscriptions
    const expiringSubs = allActivations
      .filter((a) => {
        if (!a.expirationDate) return false;
        const diff = Math.ceil(
          (new Date(a.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return diff >= 0 && diff <= 7;
      })
      .map((a) => ({
        customer: a.customer?.name || "Unknown",
        service: a.sale?.service?.name || "Unknown",
        expiry: new Date(a.expirationDate).toDateString(),
        daysLeft: Math.ceil(
          (new Date(a.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
        ),
      }));

    // 4. Employee Overview per Service
    const serviceRoleMap = {};

    for (const user of allUsers) {
      const serviceName = user.assignedService?.name || "Unknown";
      const role = user.role || "unknown";

      if (!serviceRoleMap[serviceName]) {
        serviceRoleMap[serviceName] = {
          sales: 0,
          support: 0,
          managers: 0,
        };
      }

      if (role === "sales_agent") serviceRoleMap[serviceName].sales += 1;
      else if (role === "support") serviceRoleMap[serviceName].support += 1;
      else if (role === "manager") serviceRoleMap[serviceName].managers += 1;
    }

    const employeeOverview = Object.entries(serviceRoleMap).map(
      ([service, counts]) => ({
        service,
        ...counts,
      })
    );

    // ✅ Final Response
    res.status(200).json({
      success: true,
      dashboardData,
      salesLeaderboardData,
      expiringSubs,
      employeeOverview,
    });
  } catch (err) {
    console.error("Internal Server Error!", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};



module.exports = {
  getActivationDashboard,
  getSaleDashboard,
  getAdminDashboard,
};
