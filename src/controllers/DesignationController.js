const Designation = require("../models/Designation");

// Create a new designation
const createDesignation = async (req, res) => {
    try {
        const { designation, department, level, service, description } = req.body;

        if (!designation || !department || !service) {
            return res.status(400).json({ error: "Name, Department, and Service are required" });
        }

        const newDesignation = new Designation({ designation, department, level, service, description });
        const savedDesignation = await newDesignation.save();

        res.status(201).json(savedDesignation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Get all designations
const getDesignations = async (req, res) => {
    try {
        const designations = await Designation.find()
            .populate("department", "name")
            .populate("service", "name");
        res.json(designations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Get single designation by ID
const getDesignationById = async (req, res) => {
    try {
        const { id } = req.params;
        const designation = await Designation.findById(id)
            .populate("department", "name")
            .populate("service", "name");

        if (!designation) {
            return res.status(404).json({ error: "Designation not found" });
        }

        res.json(designation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Update designation
const updateDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { designation, department, level, service, description } = req.body;

        const updatedDesignation = await Designation.findByIdAndUpdate(
            id,
            { designation, department, level, service, description },
            { new: true, runValidators: true }
        );

        if (!updatedDesignation) {
            return res.status(404).json({ error: "Designation not found" });
        }

        res.json(updatedDesignation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Delete designation
const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDesignation = await Designation.findByIdAndDelete(id);

        if (!deletedDesignation) {
            return res.status(404).json({ error: "Designation not found" });
        }

        res.json({ message: "Designation deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};


module.exports = { createDesignation, getDesignations, getDesignationById, updateDesignation, deleteDesignation }