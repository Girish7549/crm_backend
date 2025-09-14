const OfficeIP = require('../models/OfficeIP');

const getIPs = async (req, res) => {
    try {
        const ips = await OfficeIP.find();
        res.json({ success: true, data: ips });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getIPById = async (req, res) => {
    try {
        const ip = await OfficeIP.findById(req.params.id);
        if (!ip) return res.status(404).json({ success: false, message: "IP not found" });
        res.json({ success: true, data: ip });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const addIP = async (req, res) => {
    try {
        const { ip } = req.body;
        const newIP = await OfficeIP.create({ ip });
        res.status(201).json({ success: true, data: newIP });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateIP = async (req, res) => {
    try {
        const { ip } = req.body;
        const updated = await OfficeIP.findByIdAndUpdate(
            req.params.id,
            { ip },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "IP not found" });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteIP = async (req, res) => {
    try {
        const deleted = await OfficeIP.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "IP not found" });
        res.json({ success: true, message: "IP deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { addIP, getIPs, getIPById, updateIP, deleteIP }
