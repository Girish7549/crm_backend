// models/CompanyPayment.js
const mongoose = require('mongoose')

const AccountPaymentWebSchema = new mongoose.Schema({
  company: { type: String, required: true }, 
  name: { type: String, required: true },   
  email: { type: String, required: true },   
  bank: { type: String, required: true },   
  note: { type: String, required: true },   
  image: { type: String, required: true },   
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('AccountPaymentWeb', AccountPaymentWebSchema)
