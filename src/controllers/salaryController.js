const Attendance = require("../models/Attendance");
const User = require("../models/User");

const calculateSalary = async (req, res) => {
    try {
        const { userId, month, year } = req.query;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);

        const records = await Attendance.find({
            user: userId,
            date: { $gte: start, $lte: end },
        });

        let totalHours = 0;
        records.forEach(r => totalHours += r.totalWorkingHours);

        // salary calculation per hour
        const expectedHours = 26 * 8; 
        const hourlyRate = user.salary / expectedHours;

        const finalSalary = parseFloat((totalHours * hourlyRate).toFixed(2));

        res.json({
            employee: user.name,
            month,
            year,
            baseSalary: user.salary,
            totalHoursWorked: totalHours,
            finalSalary,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { calculateSalary }
