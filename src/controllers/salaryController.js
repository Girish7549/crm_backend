const Salary = require("../models/Salary");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const moment = require("moment");
const nodemailer = require("nodemailer");

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
        const netSalary = earnedSalary + incentives;

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

        res.status(200).json(salaries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

function convertNumberToWords(amount) {
    const words = require("number-to-words");
    return words.toWords(amount);
}

const generatePayslipPDFOLD = async (salary) => {
    const user = salary.user;
    const companyName = "DeemandTV Private Limited";
    const companyAddress = "CALL MAX LLC, NJ, USA";

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(companyName, 105, 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(companyAddress, 105, 21, { align: "center" });

    doc.line(10, 25, 200, 25);

    const startDate = moment(`${salary.year}-${salary.month}-01`);
    const endDate = moment(startDate).endOf("month").format("DD MMM YYYY");
    doc.text(`Pay Period: ${startDate.format("DD MMM YYYY")} - ${endDate}`, 14, 33);

    // Employee & Bank details
    const empDetails = [
        ["Payroll / Work Location", "Deemand TV HQ"],
        ["Employee Name", user.name],
        ["Employee Email", user.email],
        ["Department", user.department?.name || "-"],
        ["Designation", user.designation?.name || "-"],
    ];

    const bankDetails = [
        ["Bank Name", user.bankName || "-"],
        ["IFSC Code", user.ifscCode || "-"],
        ["Bank A/c No.", user.bankAccNumber || "-"],
        ["Branch Name", user.branchName || "-"],
        ["PF No.", user.pfNumber || "-"],
        ["UAN No.", user.uanNumber || "-"],
        ["ESIC No.", user.esicNumber || "-"],
    ];

    doc.autoTable({
        startY: 38,
        head: [["Employee Details", "Bank Details"]],
        body: empDetails.map((row, i) => [
            `${row[0]}: ${row[1]}`,
            `${bankDetails[i] ? `${bankDetails[i][0]}: ${bankDetails[i][1]}` : ""}`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [240, 240, 240] },
        styles: { fontSize: 9, cellPadding: 2 },
    });

    // Salary & Attendance
    const startY = doc.lastAutoTable.finalY + 8;
    const salaryTable = {
        head: [["Standard Salary Details", "Attendance Summary"]],
        body: [
            [`Basic Salary: ${salary.baseSalary.toFixed(2)}`, `Worked Days: ${salary.breakdown.fullDays}`],
            [`Overtime: ${salary.overtime.toFixed(2)}`, `Weekly Off: 4`],
            [`Extra Work Pay: ${salary.incentives.toFixed(2)}`, `Holiday: 0`],
            [`Loans & Advance: 0`, `Paid Leave: ${salary.breakdown.onLeave}`],
            [`Adjustments: 0`, `Payable Days: ${salary.breakdown.fullDays + salary.breakdown.halfDays * 0.5 + salary.breakdown.onLeave}`],
            [`Penalties: ${salary.deductions.toFixed(2)}`, ``],
            [`Gross Pay: ${salary.netSalary.toFixed(2)}`, ``],
        ],
    };

    doc.autoTable({
        startY,
        head: salaryTable.head,
        body: salaryTable.body,
        theme: "grid",
        headStyles: { fillColor: [230, 230, 230] },
        styles: { fontSize: 9, cellPadding: 2 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Amount in words: ${convertNumberToWords(salary.netSalary)} only`, 14, finalY);

    doc.setFontSize(9);
    doc.text("For Deemand TV Pvt Ltd", 150, finalY + 20);
    doc.text("Authorized Signatory", 150, finalY + 30);

    return Buffer.from(doc.output("arraybuffer"));
};
const generatePayslipPDF = async (salary) => {
    const user = salary.user;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("DeemandTV Pvt Ltd", 105, 15, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("CALL MAX LLC, NJ, USA", 105, 21, { align: "center" });
    doc.line(10, 25, 200, 25);

    // Pay Period
    const startDate = moment(`${salary.year}-${salary.month}-01`);
    const endDate = moment(startDate).endOf("month").format("DD MMM YYYY");
    doc.text(`Pay Period: ${startDate.format("DD MMM YYYY")} - ${endDate}`, 14, 33);

    // Employee + Bank Details Table
    const empDetails = [
        ["Employee Name", user.name],
        ["Employee ID", user.empId || "-"],
        ["Department", user.department?.name || "-"],
        ["Designation", user.designation?.name || "-"],
        ["Email", user.email],
    ];

    const bankDetails = [
        ["Bank Name", user.bankName || "-"],
        ["Account No.", user.bankAccNumber || "-"],
        ["IFSC", user.ifscCode || "-"],
        ["Branch", user.branchName || "-"],
    ];

    doc.autoTable({
        startY: 38,
        head: [["Employee Details", "Bank Details"]],
        body: empDetails.map((row, i) => [
            `${row[0]}: ${row[1]}`,
            `${bankDetails[i] ? `${bankDetails[i][0]}: ${bankDetails[i][1]}` : ""}`
        ]),
        theme: "grid",
        headStyles: { fillColor: [220, 220, 220], textColor: 0 },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Salary + Attendance Table
    const startY = doc.lastAutoTable.finalY + 8;
    const salaryTable = {
        head: [["Earnings / Salary Details", "Attendance Summary"]],
        body: [
            [`Basic Salary: ₹${salary.baseSalary.toFixed(2)}`, `Full Days: ${salary.breakdown.fullDays}`],
            [`Overtime: ₹${salary.overtime.toFixed(2)}`, `Half Days: ${salary.breakdown.halfDays}`],
            [`Incentives: ₹${salary.incentives.toFixed(2)}`, `Paid Leave: ${salary.breakdown.onLeave}`],
            [`Deductions: ₹${salary.deductions.toFixed(2)}`, `Absent: ${salary.breakdown.absents}`],
            [`Net Salary: ₹${salary.netSalary.toFixed(2)}`, `Payable Days: ${(salary.breakdown.fullDays + salary.breakdown.halfDays * 0.5 + salary.breakdown.onLeave).toFixed(1)}`],
        ]
    };

    doc.autoTable({
        startY,
        head: salaryTable.head,
        body: salaryTable.body,
        theme: "grid",
        headStyles: { fillColor: [200, 200, 200] },
        styles: { fontSize: 9, cellPadding: 3 },
    });

    // Amount in Words
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`Amount in words: ${convertNumberToWords(salary.netSalary)} only`, 14, finalY);

    // Footer
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("For Deemand TV Pvt Ltd", 150, finalY + 20);
    doc.text("Authorized Signatory", 150, finalY + 30);

    return Buffer.from(doc.output("arraybuffer"));
};

const generatePayslipEmailHTML = (user, salary) => {
    return `
    <div style="font-family:Arial,sans-serif; font-size:14px; color:#333;">
      <div style="text-align:center; margin-bottom:20px;">
        <h2 style="margin:0;">DeemandTV Pvt Ltd</h2>
        <p style="margin:0;">CALL MAX LLC, NJ, USA</p>
        <hr style="border:none; border-top:1px solid #ccc; margin:10px 0;">
      </div>

      <p>Dear <b>${user.name}</b>,</p>
      <p>Please find attached your payslip for <b>${salary.month} ${salary.year}</b>.</p>

      <table style="width:100%; border-collapse:collapse; margin-top:15px;">
        <tr style="background:#f0f0f0;">
          <th style="padding:8px; border:1px solid #ccc;">Detail</th>
          <th style="padding:8px; border:1px solid #ccc;">Value</th>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ccc;">Net Salary</td>
          <td style="padding:8px; border:1px solid #ccc;">₹${salary.netSalary.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ccc;">Amount in Words</td>
          <td style="padding:8px; border:1px solid #ccc;">${convertNumberToWords(salary.netSalary)} only</td>
        </tr>
      </table>

      <p style="margin-top:20px;">Regards,<br><b>HR Department</b><br>Deemand TV Pvt Ltd</p>
    </div>
    `;
};


// Send payslip via email
const sendPayslipEmail = async (req, res) => {
    try {
        const { salaryId } = req.params;

        // Fetch salary and populate user, department, and designation
        const salary = await Salary.findById(salaryId).populate({
            path: "user",
            populate: [
                { path: "department", select: "name" },
                { path: "designation", select: "name" },
            ],
        });

        if (!salary) return res.status(404).json({ message: "Salary not found" });

        const user = salary.user;
        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate PDF
        const pdfBuffer = await generatePayslipPDF(salary);
        const htmlContent = generatePayslipEmailHTML(salary.user, salary);


        // Setup transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true,
            auth: {
                user: "invoice@deemandtv.com",
                pass: "Adzdrio@321",
            },
        });

        // Mail options
        const mailOptions = {
            from: `"Deemand TV" <invoice@deemandtv.com>`,
            to: user.email,
            subject: `Payslip for ${salary.month} ${salary.year}`,
            html: htmlContent,
            attachments: [
                {
                    filename: `${user.name}_Payslip_${salary.month}_${salary.year}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        await transporter.sendMail(mailOptions);

        // Mark as sent
        salary.slipSent = true;
        await salary.save();

        res.json({ message: `Payslip emailed successfully to ${user.email}` });
    } catch (err) {
        console.error("Error sending payslip:", err);
        res.status(500).json({ message: "Failed to send payslip email" });
    }
};


module.exports = { generateSalary, getSalaries, generatePayslipPDF, sendPayslipEmail };
