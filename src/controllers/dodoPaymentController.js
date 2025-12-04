const dodo = require("../services/dodoPayment");

// CREATE PAYMENT CHARGE
exports.createPaymentChargeDodo = async (req, res) => {
    try {
        const { amount, currency, card } = req.body;

        const payload = {
            amount,
            currency: currency || "USD",
            card_number: card.number,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            cvv: card.cvv,
            callback_url: "https://crmbackend.adzdrio.com/api/payment/payment-callback"
        };

        const result = await dodo.chargeCard(payload);
        res.json(result);

    } catch (error) {
        res.status(400).json({ error });
    }
};

// PAYMENT CALLBACK (WEBHOOK)
exports.dodoPaymentCallbakc = async (req, res) => {
    if (!dodo.verifyWebhook(req)) {
        return res.status(401).json({ message: "Invalid webhook signature" });
    }

    console.log("Dodo Payment Webhook:", req.body);

    // TODO: Update order/payment status in database

    res.status(200).send("OK");
};
