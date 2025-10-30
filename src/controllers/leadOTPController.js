const nodemailer = require("nodemailer");
const LeadOTPJS = require("../models/LeadOTP.JS");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpMail = async (req, res) => {
    const { email } = req.body;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER_OTP, SMTP_PASS_OTP } = process.env;

    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    try {
        const otpCode = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 10 minutes

        // Save OTP in DB
        await LeadOTPJS.create({ email, code: otpCode, expiresAt: expiry });

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: true,
            auth: { user: SMTP_USER_OTP, pass: SMTP_PASS_OTP },
        });

        const mailOptions = {
            from: `"DeemandTV - Team" <${SMTP_USER_OTP}>`,
            to: email,
            subject: "Your Authentication Code for Verification",
            html: `
        <p>Hello,</p>
        <p>Your Authentication Code for verification is:</p>
        <h2>${otpCode}</h2>
        <p>This Authentication Code will expire in 5 minutes.</p>
        <p>Regards,<br/>DeemandTV Team</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to send OTP", error: error.message });
    }
};

const verifyLeadOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp)
        return res.status(400).json({ success: false, message: "Email and OTP are required" });

    try {
        const otpRecord = await LeadOTPJS.findOne({ email, code: otp });
        if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid OTP" });

        if (otpRecord.expiresAt < new Date())
            return res.status(400).json({ success: false, message: "OTP expired" });

        // OTP verified → delete record
        await LeadOTPJS.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "OTP verification failed", error: error.message });
    }
};

module.exports = { sendOtpMail, verifyLeadOtp };
