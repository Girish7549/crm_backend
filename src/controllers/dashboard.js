const mongoose = require("mongoose");
const SaleActivation = require("../models/SaleActivation");
const TrialActivation = require("../models/TrialActivation");
const Sales = require("../models/Sales");
const Trial = require("../models/Trial");
const FollowUp = require("../models/FollowUp");
const Callback = require("../models/Callback");
const Service = require("../models/Service");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

/* ================================
   1. Activation Dashboard
================================= */
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

    res.status(200).json({
      success: true,
      message: "Dashboard Data Retrieved",
      data: {
        trial_expiredSoon_count: trial_expiredSoon_count.length,
        trial_pending_count: trial_pending_count.length,
        trial_live_count: trial_live_count.length,
        sale_expiredSoon_count: sale_expiredSoon_count.length,
        sale_pending_count: sale_pending_count.length,
        sale_live_count: sale_live_count.length,
      },
    });
  } catch (err) {
    console.error("Internal Server Error!", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

/* ================================
   2. Sale Dashboard (with Incentives)
================================= */
const getSaleDashboard = async (req, res) => {
  try {
    const empId = req.params.id;

    // Base data
    const all_Sale = await Sales.find({ assignedEmployee: empId });
    const all_Trial = await Trial.find({ assignedEmployee: empId });
    const all_FollowUps = await FollowUp.find({ salesPerson: empId });
    const all_Callback = await Callback.find({ createdBy: empId });

    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // =============================
    // 1. Monthly Sales
    // =============================
    const monthly_sale = all_Sale.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    });

    // =============================
    // 2. Profile
    // =============================
    const user = await User.findById(empId);
    const profile = {
      name: user.name,
      role: user.role,
      target: user.target
    };

    // =============================
    // Dollar-Based Incentive
    // =============================
    const totalSalesAmount = monthly_sale.reduce(
      (sum, s) => sum + (s.amount || 0),
      0
    );

    function calculateDollarIncentive(total) {
      if (total >= 10000) return 25000;
      if (total >= 7000) return 20000;
      if (total >= 6000) return 15000;
      if (total >= 5000) return 10000;
      if (total >= 4500) return 8000;
      if (total >= 4000) return 6000;
      if (total >= 3500) return 4000;
      return 0;
    }
    const dollarIncentive = calculateDollarIncentive(totalSalesAmount);

    // =============================
    // Week Ranges (Tue 9PM → Mon 9AM)
    // =============================
    function getCustomWeekRanges(year, month) {
      const ranges = [];
      const firstDay = new Date(year, month, 1);

      // find first Tuesday 9:00 PM
      let firstTuesday = new Date(firstDay);
      while (firstTuesday.getDay() !== 2) {
        firstTuesday.setDate(firstTuesday.getDate() + 1);
      }
      firstTuesday.setHours(21, 0, 0, 0); // Tuesday 9 PM

      // create 4 week ranges
      for (let i = 0; i < 4; i++) {
        const start = new Date(firstTuesday);
        start.setDate(start.getDate() + i * 7);

        const end = new Date(start);
        end.setDate(start.getDate() + 6); // move to Monday
        end.setHours(9, 0, 0, 0); // Monday 9 AM

        ranges.push({ start, end });
      }
      return ranges;
    }

    const ranges = getCustomWeekRanges(currentYear, currentMonth);

    const salesData = ranges.map((range, i) => {
      const count = monthly_sale.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= range.start && d <= range.end;
      }).length;
      return { week: `Week ${i + 1}`, sales: count };
    });

    const weeklySales = salesData.map((w) => w.sales);

    // =============================
    // Weekly Consistency Incentive
    // =============================
    function calculateWeeklyIncentive(weeklySales) {
      const weeklyTarget = 6;
      const weeklyBonus = 1000;
      let totalBonus = 0;
      let carryForward = 0;
      const weekDetails = [];

      for (let i = 0; i < weeklySales.length; i++) {
        let weekSales = weeklySales[i] + carryForward;
        let bonus = 0;

        // if (weekSales >= weeklyTarget) {
        //   bonus = weeklyBonus;
        //   weekSales -= weeklyTarget;
        //   carryForward = weekSales; // extra carry forward
        // } else {
        //   carryForward = weekSales;
        // }

        if (weekSales >= weeklyTarget) {
          bonus = weeklyBonus;
          carryForward = weekSales - weeklyTarget; // keep extra only
        } else {
          bonus = 0;
          carryForward = 0; // reset if target not reached
        }

        totalBonus += bonus;
        weekDetails.push({
          week: `Week ${i + 1}`,
          sales: weeklySales[i],
          carryForward,
          bonus,
        });
      }
      return { totalBonus, weekDetails };
    }

    const weeklyIncentive = calculateWeeklyIncentive(weeklySales);

    // =============================
    // Sales Count Incentive
    // =============================
    let salesIncentive = 0;
    let managerBonus = 0;
    const monthlyCount = monthly_sale.length;

    if (monthlyCount >= 30) {
      salesIncentive = 10000;
    } else if (monthlyCount >= 28) {
      salesIncentive = 8000;
    } else if (monthlyCount >= 24) {
      salesIncentive = 4000;
      // Manager bonus only for exactly 24 + weekly consistency
      const allWeeksHit = weeklyIncentive.weekDetails.every(
        (w) => w.bonus > 0
      );
      if (allWeeksHit) {
        managerBonus = 2000;
        salesIncentive += managerBonus;
      }
    } else {
      salesIncentive = weeklyIncentive.totalBonus; // only weekly incentive
    }

    // =============================
    // Pending Payment
    // =============================
    const pending_payment = all_Sale
      .filter((item) => item.status === "pending")
      .reduce((total, item) => total + (item.totalAmount || 0), 0);

    // =============================
    // Today’s follow-ups & callbacks
    // =============================
    const follow_ups_today = all_FollowUps.length;
    const callback_today = all_Callback.filter((item) => {
      const scheduledTime = new Date(item.scheduledTime);
      return (
        scheduledTime.getDate() === currentDate &&
        scheduledTime.getMonth() === currentMonth &&
        scheduledTime.getFullYear() === currentYear
      );
    });

    // =============================
    // Trial pending
    // =============================
    const trial_pending = all_Trial.filter((item) => item.status === "pending");

    // =============================
    // Attendance
    // =============================
    const attendances = await Attendance.find({
      userId: empId,
      loginTime: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
    });

    let daysPresent = attendances.filter(
      (a) => a.status === "full" || a.status === "half"
    ).length;
    let leaves = attendances.filter((a) => a.status === "absent").length;

    const lateLogins = attendances.filter((a) => {
      const loginTime = new Date(a.loginTime);
      return (
        loginTime.getHours() > 9 ||
        (loginTime.getHours() === 9 && loginTime.getMinutes() > 15)
      );
    }).length;

    const attendanceData = {
      daysPresent,
      lateLogins,
      leaves,
    };

    // =============================
    // Top 3 Performers of Month
    // =============================
    const monthly_sales_all = await Sales.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
      },
      { $group: { _id: "$assignedEmployee", sales: { $sum: 1 } } },
      { $sort: { sales: -1 } },
      { $limit: 3 },
    ]);

    const topPerformers = await Promise.all(
      monthly_sales_all.map(async (p) => {
        const performer = await User.findById(p._id);
        return {
          name: performer?.name || "Unknown",
          sales: p.sales,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${performer?.name || "X"
            }`,
        };
      })
    );

    // =============================
    // Final Incentive (Max)
    // =============================
    let finalIncentive = 0;
    let finalSource = "";

    if (monthlyCount >= 30 || monthlyCount >= 28 || monthlyCount >= 24) {
      // Case: High sales count → compare only salesCount vs dollar-based
      if (salesIncentive >= dollarIncentive) {
        finalIncentive = salesIncentive;
        finalSource = "Sales Count Based";
      } else {
        finalIncentive = dollarIncentive;
        finalSource = "Dollar Based";
      }
    } else {
      // Case: monthlyCount < 24 → compare weekly vs dollar-based
      if (weeklyIncentive.totalBonus >= dollarIncentive) {
        finalIncentive = weeklyIncentive.totalBonus;
        finalSource = "Weekly Consistency";
      } else {
        finalIncentive = dollarIncentive;
        finalSource = "Dollar Based";
      }
    }


    // =============================
    // Final Response
    // =============================
    let responseData = {
      monthly_sale: monthly_sale.length,
      pending_payment,
      follow_ups_today,
      callback_today: callback_today.length,
      trial_pending: trial_pending.length,

      profile,
      salesData,
      attendanceData,
      topPerformers,

      incentive: {
        dollarBased: {
          totalSalesAmount,
          value: dollarIncentive,
        },
        salesCountBased: {
          monthlyCount,
          value: salesIncentive,
          managerBonus,
        },
        weeklyConsistency: weeklyIncentive,
        final: {
          value: finalIncentive,
          source: finalSource,
        }
      },
    };

    res.status(200).json({
      success: true,
      message: "Dashboard Data Retrieved",
      data: responseData,
    });
  } catch (err) {
    console.error("Internal Server Error !", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

// const getSaleDashboard = async (req, res) => {
//   try {
//     const empId = req.params.id;

//     // Base data
//     const all_Sale = await Sales.find({ assignedEmployee: empId });
//     const all_Trial = await Trial.find({ assignedEmployee: empId });
//     const all_FollowUps = await FollowUp.find({ salesPerson: empId });
//     const all_Callback = await Callback.find({ createdBy: empId });

//     const now = new Date();
//     const currentDate = now.getDate();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();

//     // =============================
//     // 1. Monthly Sales
//     // =============================
//     const monthly_sale = all_Sale.filter((item) => {
//       const createdAt = new Date(item.createdAt);
//       return (
//         createdAt.getMonth() === currentMonth &&
//         createdAt.getFullYear() === currentYear
//       );
//     });


//     // =============================
//     // 1.Profile Data
//     // =============================
//     const user = await User.findById(empId);
//     const profile = {
//       name: user.name,
//       role: user.role,
//     };

//     // =============================
//     // Incentive Calculation
//     // =============================
//     function getTuesdayWeekRanges(year, month) {
//       const ranges = [];
//       const firstDay = new Date(year, month, 1);

//       // find first Tuesday of month
//       let firstTuesday = new Date(firstDay);
//       while (firstTuesday.getDay() !== 2) {
//         firstTuesday.setDate(firstTuesday.getDate() + 1);
//       }

//       // build 4 weeks (Tue → next Mon 10:00AM)
//       for (let i = 0; i < 4; i++) {
//         const start = new Date(firstTuesday);
//         start.setDate(start.getDate() + i * 7);

//         const end = new Date(start);
//         end.setDate(start.getDate() + 6); // move to Monday
//         end.setHours(10, 0, 0, 0); // cutoff at 10:00 AM

//         // cap inside the same month
//         if (start.getMonth() !== month) break;
//         if (end.getMonth() !== month) {
//           end.setMonth(month + 1, 0); // last date of current month
//           end.setHours(23, 59, 59, 999); // end of day if spill over
//         }

//         ranges.push({ start, end });
//       }

//       return ranges;
//     }


//     const ranges = getTuesdayWeekRanges(currentYear, currentMonth);

//     const salesData = ranges.map((range, i) => {
//       const count = monthly_sale.filter((s) => {
//         const d = new Date(s.createdAt);
//         return d >= range.start && d <= range.end;
//       }).length;
//       return { week: `Week ${i + 1}`, sales: count };
//     });

//     const weeklySales = salesData.map((w) => w.sales);

//     // Carry-forward incentive function
//     function calculateIncentive(weeklySales) {
//       const weeklyTarget = 6;
//       const weeklyBonus = 1000;
//       let totalBonus = 0;
//       let carryForward = 0;
//       const weekDetails = [];

//       for (let i = 0; i < weeklySales.length; i++) {
//         let weekSales = weeklySales[i] + carryForward;
//         let bonus = 0;

//         if (weekSales >= weeklyTarget) {
//           bonus = weeklyBonus;
//           weekSales -= weeklyTarget;
//           carryForward = weekSales; // extra goes to next week
//         } else {
//           carryForward = 0; // reset if not enough
//         }

//         totalBonus += bonus;
//         weekDetails.push({
//           week: `Week ${i + 1}`,
//           sales: weeklySales[i],
//           carryForward,
//           bonus,
//         });
//       }

//       return { totalBonus, weekDetails, target: user.target };
//     }

//     const incentive = calculateIncentive(weeklySales);

//     // =============================
//     // 2. Pending Payments
//     // =============================
//     const pending_payment = all_Sale
//       .filter((item) => item.status === "pending")
//       .reduce((total, item) => total + (item.totalAmount || 0), 0);

//     // =============================
//     // 3. Today’s follow-ups & callbacks
//     // =============================
//     const follow_ups_today = all_FollowUps.length;
//     const callback_today = all_Callback.filter((item) => {
//       const scheduledTime = new Date(item.scheduledTime);
//       return (
//         scheduledTime.getDate() === currentDate &&
//         scheduledTime.getMonth() === currentMonth &&
//         scheduledTime.getFullYear() === currentYear
//       );
//     });

//     // =============================
//     // 4. Trial pending
//     // =============================
//     const trial_pending = all_Trial.filter((item) => item.status === "pending");

//     // =============================
//     // 5. Monthly Attendance
//     // =============================
//     const attendances = await Attendance.find({
//       userId: empId,
//       loginTime: {
//         $gte: new Date(currentYear, currentMonth, 1),
//         $lt: new Date(currentYear, currentMonth + 1, 1),
//       },
//     });

//     let daysPresent = attendances.filter(
//       (a) => a.status === "full" || a.status === "half"
//     ).length;
//     let leaves = attendances.filter((a) => a.status === "absent").length;

//     const lateLogins = attendances.filter((a) => {
//       const loginTime = new Date(a.loginTime);
//       return (
//         loginTime.getHours() > 9 ||
//         (loginTime.getHours() === 9 && loginTime.getMinutes() > 15)
//       );
//     }).length;

//     const attendanceData = {
//       daysPresent,
//       lateLogins,
//       leaves,
//     };

//     // =============================
//     // 6. Top 3 Performers of Month
//     // =============================
//     const monthly_sales_all = await Sales.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(currentYear, currentMonth, 1),
//             $lt: new Date(currentYear, currentMonth + 1, 1),
//           },
//         },
//       },
//       { $group: { _id: "$assignedEmployee", sales: { $sum: 1 } } },
//       { $sort: { sales: -1 } },
//       { $limit: 3 },
//     ]);

//     const topPerformers = await Promise.all(
//       monthly_sales_all.map(async (p) => {
//         const performer = await User.findById(p._id);
//         return {
//           name: performer?.name || "Unknown",
//           sales: p.sales,
//           avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${performer?.name || "X"
//             }`,
//         };
//       })
//     );



//     // =============================
//     // Final Response
//     // =============================
//     let responseData = {
//       monthly_sale: monthly_sale.length,
//       pending_payment,
//       follow_ups_today,
//       callback_today: callback_today.length,
//       trial_pending: trial_pending.length,

//       profile,
//       salesData,
//       attendanceData,
//       topPerformers,

//       // Incentive details
//       incentive,
//     };

//     res.status(200).json({
//       success: true,
//       message: "Dashboard Data Retrieved",
//       data: responseData,
//     });
//   } catch (err) {
//     console.error("Internal Server Error !", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error!",
//     });
//   }
// };


/* ================================
   3. Admin Dashboard
================================= */
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

    // Per service summary
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

    // Top 5 Sales Employees Leaderboard
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

    // Expiring subscriptions
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

    // Employee overview per service
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
