require('dotenv').config(); // load environment variables

module.exports = {
    merchantId: process.env.DODO_MERCHANT_ID,
    secretKey: process.env.DODO_SECRET_KEY,
    apiBaseUrl: process.env.DODO_API_BASE_URL,
};
