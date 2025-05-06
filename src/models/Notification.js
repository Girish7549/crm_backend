const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  callback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Callback',
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Notification', NotificationSchema)
