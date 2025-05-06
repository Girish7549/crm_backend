const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

const createAttendence = async (req, res) => {
    const { userId, loginTime, logoutTime, durationSeconds } = req.body;

    if (!userId || !loginTime || !logoutTime || typeof durationSeconds !== 'number') {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const record = await Attendance.create({
            userId,
            loginTime,
            logoutTime,
            durationSeconds,
        });
        res.status(201).json({ message: 'Attendance recorded', record });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createAttendence
};