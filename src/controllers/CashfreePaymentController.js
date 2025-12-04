const axios = require("axios");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const dotenv = require("dotenv");


dotenv.config();

const { CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET, CASHFREE_BASE_URL, SMTP_HOST, SMTP_PORT, SMTP_USER_PAYMENT, SMTP_PASS_PAYMENT, CURRENCY_API } = process.env;


const getDollarToInr = async () => {
    const apiUrl = `https://apilayer.net/api/live?access_key=${CURRENCY_API}&currencies=INR&source=USD&format=1`;
    // const apiUrl = "https://api.freecurrencyapi.com/v1/latest";
    // const apiKey = CURRENCY_API;

    try {
        const response = await axios.get(apiUrl);
        const rate = response.data?.quotes?.USDINR;
        console.log("Dollar in INR :", rate)
        if (!rate) throw new Error("Currency rate not found");
        return rate;
    } catch (error) {
        console.error("Error fetching USD→INR rate:", error.message);
        return 89.9;
    }
};

const createPaymentLink_LIVE = async (req, res) => {
    const { customer_name, customer_email, customer_phone, amount } = req.body;

    try {
        console.log("Name :", customer_name)
        console.log("Email :", customer_email)
        console.log("Phone :", customer_phone)
        console.log("Amount :", amount)

        const usdToInrRate = await getDollarToInr();
        const amount_inr = (amount * usdToInrRate).toFixed(2);
        console.log(`💰 ${amount} USD = ₹${amount_inr} INR`);

        const response = await axios.post(
            CASHFREE_BASE_URL,
            {
                order_amount: amount_inr,
                order_currency: "INR",
                order_purpose: "Payment for Web Developer Project",
                order_tags: { created_by: "Web Developer" },
                customer_details: {
                    customer_id: customer_phone,
                    customer_name,
                    customer_email,
                    customer_phone,
                },
                order_notify: { send_email: true },

            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": CASHFREE_CLIENT_ID,
                    "x-client-secret": CASHFREE_CLIENT_SECRET,
                    "x-api-version": "2022-09-01",
                },
            }
        );

        // Cashfree-generated order ID and payment link
        const cashfreeOrderId = response.data.order_id || response.data.data?.order_id;
        const paymentLink = response.data.payment_link || response.data.data?.payment_link;

        if (!paymentLink) {
            return res.status(500).json({
                success: false,
                message: "Payment link not returned from Cashfree",
            });
        }

        // 2️⃣ Configure email transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: true,
            auth: {
                user: SMTP_USER_PAYMENT,
                pass: SMTP_PASS_PAYMENT,
            },
        });

        // 3️⃣ Email template
        const mailOptions = {
            from: `"DeemandTV - Account Team" <${SMTP_USER_PAYMENT}>`,
            to: customer_email,
            subject: `Payment Link for Order #${cashfreeOrderId}`,
            html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
          <h2>Hello ${customer_name},</h2>
          <p>Thank you for your purchase! Please complete your payment of <b>₹${amount}</b> using the secure link below:</p>
          <p>
            <a href="${paymentLink}" 
              style="background:#007bff;color:#fff;padding:10px 20px;
                     border-radius:6px;text-decoration:none;font-weight:bold;">
              Pay Now
            </a>
          </p>
          <p>If the button doesn’t work, copy and open this link:<br/>
            <a href="${paymentLink}">${paymentLink}</a>
          </p>
          <hr/>
          <p>Best regards,<br/>DeemandTV Sales Team</p>
        </div>
      `,
        };

        // 4️⃣ Send the email
        await transporter.sendMail(mailOptions);

        // 5️⃣ Return success
        res.status(200).json({
            success: true,
            message: "Payment link created and sent to customer via email",
            paymentLink,
            cashfreeOrderId,
        });

    } catch (error) {
        console.error("Error creating payment link:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create or send payment link",
            error: error.message,
        });
    }
};

const createPaymentLink_Cashfree = async (req, res) => {
    const { customer_name, customer_email, customer_phone, amount } = req.body;

    try {
        console.log("Creating payment link for:", customer_name, customer_email, customer_phone, amount);

        const usdToInrRate = await getDollarToInr();
        const amount_inr = (amount * usdToInrRate).toFixed(2);
        console.log(`💰 ${amount} USD = ₹${amount_inr} INR`);

        const response = await axios.post(
            CASHFREE_BASE_URL,
            {
                link_amount: amount_inr,
                link_currency: "INR",
                link_note: "Payment for Web Developer Project",
                link_purpose: "Web Developer Project Payment",
                customer_details: {
                    customer_name,
                    customer_email,
                    customer_phone
                },
                notify_customer: true
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": CASHFREE_CLIENT_ID,
                    "x-client-secret": CASHFREE_CLIENT_SECRET,
                    "x-api-version": "2022-09-01"
                }
            }
        );


        // 🔹 Log full response to debug
        console.log("Cashfree response:", response.data);

        // 2️⃣ Correctly extract link
        const paymentLink = response.data.link_url; // use this, not response.data.payment_link
        const linkId = response.data.link_id;

        if (!paymentLink) {
            return res.status(500).json({
                success: false,
                message: "Payment link not returned from Cashfree",
                fullResponse: response.data // helps debug sandbox
            });
        }

        console.log("💰 Payment Link Created:", paymentLink);

        // 3️⃣ Configure email transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: true,
            auth: {
                user: SMTP_USER_PAYMENT,
                pass: SMTP_PASS_PAYMENT,
            },
        });

        // 4️⃣ Email template
        const mailOptions = {
            from: `"DeemandTV - Account Team" <${SMTP_USER_PAYMENT}>`,
            to: customer_email,
            subject: `Payment Link for Order #${linkId}`,
            html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
              <h2>Hello ${customer_name},</h2>
              <p>Thank you for your purchase! Please complete your payment of <b>₹${amount_inr}</b> using the secure link below:</p>
              <p>
                <a href="${paymentLink}" 
                  style="background:#007bff;color:#fff;padding:10px 20px;
                         border-radius:6px;text-decoration:none;font-weight:bold;">
                  Pay Now
                </a>
              </p>
              <p>If the button doesn’t work, copy and open this link:<br/>
                <a href="${paymentLink}">${paymentLink}</a>
              </p>
              <hr/>
              <p>Best regards,<br/>DeemandTV Sales Team</p>
            </div>
            `,
        };

        // 5️⃣ Send the email
        await transporter.sendMail(mailOptions);

        // 6️⃣ Return success
        res.status(200).json({
            success: true,
            message: "Payment link created and sent to customer via email",
            paymentLink,
            linkId,
        });

    } catch (error) {
        console.error("Error creating payment link:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create or send payment link",
            error: error.response?.data || error.message,
        });
    }
};


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentLink = async (req, res) => {
    const { customer_name, customer_email, customer_phone, amount } = req.body;

    try {
        console.log("Creating Razorpay payment link for:", customer_name, customer_email, customer_phone, amount);

        const usdToInrRate = await getDollarToInr();
        const amount_inr = (amount * usdToInrRate).toFixed(2);
        const amount_in_paise = Math.round(amount_inr * 100);
        console.log(`💰 ${amount} USD = ₹${amount_inr} INR (${amount_in_paise} paise)`);

        const response = await razorpay.paymentLink.create({
            amount: amount_in_paise,
            currency: "INR",
            accept_partial: false,
            description: "Payment for Web Developer Project",
            customer: {
                name: customer_name,
                email: customer_email,
                contact: customer_phone,
            },
            notify: {
                // sms: true,
                // email: true
            },
            reminder_enable: true,
        });

        const paymentLink = response.short_url;
        const linkId = response.id;

        console.log("💰 Payment Link Created:", paymentLink);

        // 2️⃣ Configure email transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: true,
            auth: {
                user: SMTP_USER_PAYMENT,
                pass: SMTP_PASS_PAYMENT,
            },
        });

        // 3️⃣ Email template
        const mailOptions = {
            from: `"DeemandTV - Account Team" <${SMTP_USER_PAYMENT}>`,
            to: customer_email,
            subject: `Payment Link for Order #${linkId}`,
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
                    <h2>Hello ${customer_name},</h2>
                    <p>Thank you for your purchase! Please complete your payment of <b>₹${amount_inr}</b> using the secure link below:</p>
                    <p>
                        <a href="${paymentLink}" 
                           style="background:#007bff;color:#fff;padding:10px 20px;
                                  border-radius:6px;text-decoration:none;font-weight:bold;">
                            Pay Now
                        </a>
                    </p>
                    <p>If the button doesn’t work, copy and open this link:<br/>
                        <a href="${paymentLink}">${paymentLink}</a>
                    </p>
                    <hr/>
                    <p>Best regards,<br/>DeemandTV Account Team</p>
                </div>
            `,
        };

        // 4️⃣ Send the email
        await transporter.sendMail(mailOptions);

        // 5️⃣ Return success
        res.status(200).json({
            success: true,
            message: "Payment link created and sent to customer via email",
            paymentLink,
            linkId,
        });

    } catch (error) {
        console.error("Error creating payment link:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create or send payment link",
            error: error.message || error,
        });
    }
};


module.exports = { createPaymentLink }
