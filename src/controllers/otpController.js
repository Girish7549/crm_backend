const Customer = require("../models/Customer");
const nodemailer = require("nodemailer");
const Otp = require("../models/Otp");
const Sale = require("../models/Sales");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER_OTP,
        pass: process.env.SMTP_PASS_OTP,
    },
});


const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ error: "Email is required" });

        let customer = await Customer.findOne({ email });
        if (!customer) {
            customer = new Customer({ email, name: "New User" });
            await customer.save();
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.create({
            customer: customer._id,
            code: otpCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await transporter.sendMail({
            from: `"${process.env.FROM_NAME_OTP}" <${process.env.FROM_EMAIL_OTP}>`,
            to: email,
            subject: "Your Dashboard Authentication Code",
            html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Your OTP Code</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f4f4f4; margin:0; padding:0;">
        <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; padding:0;">
          <div style="background-color:#0d6efd; color:#ffffff; text-align:center; padding:25px; font-size:28px; font-weight:bold;">Deemand Service</div>
          <div style="padding:30px 20px; text-align:center;">
            <p style="font-size:16px; color:#555;">Hello ${customer.name || "Customer"},</p>
            <p style="font-size:16px; color:#555;">Use the following authentication code to complete your login. This code is valid for 5 minutes only.</p>
             <div style="text-align:center; margin:20px 0;">
           <span style=" display:inline-block; font-size:36px; font-weight:bold; color:#0d6efd; letter-spacing:6px; padding:15px 30px; border:2px dashed #0d6efd; border-radius:8px; margin-bottom:15px;">
           ${otpCode}</span><br></div>
          </div>
            <p style="font-size:16px; color:#555; margin-top:25px;">If you did not request this code, please ignore this email.</p>
          <div style="background-color:#f4f4f4; padding:20px; text-align:center; font-size:12px; color:#888;">
            &copy; 2025 Deemand TV. All rights reserved.<br>
          </div>
        </div>
      </body>
      </html>
      `,
        });

        res.json({ message: "OTP sent successfully to email" });
    } catch (err) {
        console.error("sendOtp error:", err);
        res.status(500).json({ error: "Failed to send OTP. Please try again later." });
    }
};

// const verifyOtp = async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         if (!email || !otp)
//             return res.status(400).json({ error: "Email and OTP are required" });

//         const customer = await Customer.findOne({ email });
//         if (!customer) return res.status(404).json({ error: "Customer not found" });

//         const otpRecord = await Otp.findOne({
//             customer: customer._id,
//             code: otp,
//         });

//         if (!otpRecord) return res.status(400).json({ error: "Invalid OTP" });
//         if (otpRecord.expiresAt < Date.now())
//             return res.status(400).json({ error: "OTP expired" });

//         await Otp.deleteMany({ customer: customer._id });

//         res.json({ message: "OTP verified successfully", customer });
//     } catch (err) {
//         console.error("verifyOtp error:", err);
//         res.status(500).json({ error: "Failed to verify OTP. Please try again later." });
//     }
// };


const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const customer = await Customer.findOne({ email });
        if (!customer) return res.status(404).json({ error: "Customer not found" });

        const otpRecord = await Otp.findOne({
            customer: customer._id,
            code: otp,
        });

        if (!otpRecord) return res.status(400).json({ error: "Invalid OTP" });
        if (otpRecord.expiresAt < Date.now()) {
            return res.status(400).json({ error: "OTP expired" });
        }

        // ✅ delete OTP after verification
        await Otp.deleteMany({ customer: customer._id });

        // ✅ find all sales for customer
        const sales = await Sale.find({ customer: customer._id }).sort({
            createdAt: -1,
        });

        let planDetails = [];

        sales.forEach((sale) => {
            sale.saleItems.forEach((item) => {
                item.devices.forEach((device) => {
                    const planStart = device.createdAt || sale.createdAt;
                    const durationMonths = device.month || 0;

                    // expiration = start date + months
                    const expirationDate = new Date(planStart);
                    expirationDate.setMonth(expirationDate.getMonth() + durationMonths);

                    const totalDays = Math.ceil(
                        (expirationDate - planStart) / (1000 * 60 * 60 * 24)
                    );
                    const remainingDays = Math.max(
                        0,
                        Math.ceil((expirationDate - Date.now()) / (1000 * 60 * 60 * 24))
                    );

                    planDetails.push({
                        plan: item.plan,
                        deviceType: device.deviceType,
                        customPrice: device.customPrice,
                        paymentMethod: device.paymentMethod,
                        status: sale.status,
                        startDate: planStart,
                        expirationDate,
                        totalDays,
                        remainingDays,
                    });
                });
            });
        });

        const customerData = customer.toObject();
        // customerData.plan = planDetails;
        // console.log("customer :", customerData)

        res.json({
            message: "OTP verified successfully",
            customerData,
        });
    } catch (err) {
        console.error("verifyOtp error:", err);
        res
            .status(500)
            .json({ error: "Failed to verify OTP. Please try again later." });
    }
};

module.exports = { sendOtp, verifyOtp };
