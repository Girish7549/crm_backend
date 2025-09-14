const mongoose = require('mongoose')

const officeIPSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("OfficeIP", officeIPSchema);
