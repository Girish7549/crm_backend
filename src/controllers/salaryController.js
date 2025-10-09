const Salary = require("../models/Salary");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

// Generate salary for a user for a month
const generateSalaryOLD = async (req, res) => {
    try {
        const { userId, month, year } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if salary already exists
        const existing = await Salary.findOne({ user: userId, month, year });
        if (existing) return res.status(400).json({ message: "Salary already generated for this month" });

        // Attendance for the month
        const attendances = await Attendance.find({
            user: userId,
            date: {
                $gte: new Date(`${year}-${month}-01`),
                $lte: new Date(`${year}-${month}-31`)
            }
        });

        console.log("Attaendacnces :", attendances)

        let totalWorkingHours = 0;
        let totalOvertime = 0;
        let totalDeductions = 0;
        let hourlySalary = (user.salary / 30) / 8
        let overtimeHourlySalary = 41.66

        attendances.forEach(a => {
            totalWorkingHours += a.totalWorkingHours || 0;
            if (a.totalWorkingHours > 8) totalOvertime += a.totalWorkingHours - 8;

            // Deduction logic
            if (a.status === "half-day") {
                totalDeductions += (user.salary / 30) / 2;
            } else if (a.status === "absent") {
                totalDeductions += user.salary / 30;
            }
        });

        const baseSalary = user.salary || 0;
        const incentives = user.incentive || 0;
        const netSalary = totalWorkingHours * (hourlySalary) + incentives + totalOvertime * (overtimeHourlySalary);

        const salaryRecord = await Salary.create({
            user: userId,
            month,
            year,
            baseSalary,
            workingHours: totalWorkingHours,
            overtime: totalOvertime,
            incentives,
            deductions: totalDeductions,
            netSalary
        });

        res.status(201).json({ message: "Salary generated", salary: salaryRecord });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

const generateSalary = async (req, res) => {
    try {
        const { userId, month, year } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Attendance for the month
        const attendances = await Attendance.find({
            user: userId,
            date: {
                $gte: new Date(`${year}-${month}-01`),
                $lte: new Date(`${year}-${month}-31`),
            },
        });

        // Salary basis calculations
        const baseSalary = user.salary || 0;
        const incentives = user.incentive || 0;
        const dailySalary = baseSalary / 30;
        const hourlySalary = dailySalary / 8;
        const overtimeHourlySalary = 41.66; // You can make this dynamic later

        // Counters
        let totalWorkingHours = 0;
        let totalOvertime = 0;
        let totalDeductions = 0;
        let fullDays = 0;
        let halfDays = 0;
        let absents = 0;
        let onLeave = 0;

        attendances.forEach((a) => {
            totalWorkingHours += a.totalWorkingHours || 0;

            // Count day types
            if (a.type === "full-day") fullDays++;
            else if (a.type === "half-day") halfDays++;
            else if (a.type === "leave") absents++;
            else if (a.type === "paid-leave") onLeave++;

            // Calculate overtime
            if (a.totalWorkingHours > 8)
                totalOvertime += a.totalWorkingHours - 8;

            // Deduction logic
            if (a.type === "half-day") {
                totalDeductions += dailySalary / 2;
            } else if (a.type === "leave") {
                totalDeductions += dailySalary;
            }
        });

        // Salary calculation based on day type
        const payableDays = fullDays + halfDays * 0.5 + onLeave; // on-leave treated as paid
        const earnedSalary = payableDays * dailySalary;

        // Final net salary (including overtime & incentives)
        const netSalary = earnedSalary + incentives ;

        // Prepare salary data
        const salaryData = {
            user: userId,
            month,
            year,
            baseSalary,
            workingHours: totalWorkingHours,
            overtime: totalOvertime,
            incentives,
            deductions: totalDeductions,
            netSalary,
            breakdown: {
                fullDays,
                halfDays,
                absents,
                onLeave,
            },
        };

        // Check if salary already exists
        const existing = await Salary.findOne({ user: userId, month, year });

        let salaryRecord;
        if (existing) {
            // 🧮 Recalculate & update existing salary
            salaryRecord = await Salary.findOneAndUpdate(
                { user: userId, month, year },
                { $set: salaryData },
                { new: true } // return updated document
            );
        } else {
            // 🆕 Create new salary record
            salaryRecord = await Salary.create(salaryData);
        }

        res.status(201).json({
            message: existing
                ? "Salary recalculated and updated successfully"
                : "Salary generated successfully",
            salary: salaryRecord,
            breakdown: { fullDays, halfDays, absents, onLeave },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};



// Get salary records with filters
const getSalaries = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        const filters = {};

        if (employeeId && employeeId !== "all") filters.user = employeeId;
        if (month && month !== "all") filters.month = month;
        if (year && year !== "all") filters.year = Number(year);

        const salaries = await Salary.find(filters)
            .populate({
                path: "user",
                select: "name email empId department designation salary incentive",
                populate: {
                    path: "department",
                    select: "name",
                }
            })


        res.json(salaries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { generateSalary, getSalaries };
