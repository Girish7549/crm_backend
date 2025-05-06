const mongoose = require("mongoose");

const MacAddressSchema = new mongoose.Schema({
  macAddress: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MacAddress", MacAddressSchema);
