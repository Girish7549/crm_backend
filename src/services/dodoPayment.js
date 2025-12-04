require("dotenv").config();
const axios = require("axios");

class DodoPayment {
    constructor() {
        this.api = axios.create({
            baseURL: process.env.DODO_API_URL,
            headers: {
                Authorization: `Bearer ${process.env.DODO_API_KEY}`,
                "Content-Type": "application/json",
            },
        });
    }

    // Charge customer card
    async chargeCard(data) {
        try {
            const res = await this.api.post("/payments/charge-card", data);
            return res.data;
        } catch (err) {
            console.error("Dodo Charge Error:", err.response?.data || err.message);
            throw err.response?.data || err.message;
        }
    }

    // Verify webhook signature
    verifyWebhook(req) {
        const receivedSignature = req.headers["dodopay-signature"];
        const expectedSignature = process.env.WEBHOOK_SECRET;

        return receivedSignature && receivedSignature === expectedSignature;
    }
}

module.exports = new DodoPayment();
