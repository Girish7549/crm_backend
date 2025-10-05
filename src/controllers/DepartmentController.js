const Department = require("../models/Department");
const User = require("../models/User");

// Create a new department
const createDepartment = async (req, res) => {
    try {
        const { name, description, service } = req.body;

        if (!name || !service) {
            return res.status(400).json({ error: "Name and Service are required" });
        }

        const newDepartment = new Department({ name, description, service });
        const savedDepartment = await newDepartment.save();

        res.status(201).json(savedDepartment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Get all departments
// const getDepartments = async (req, res) => {
//     try {
//         const departments = await Department.find().populate("service", "name");
//         res.json(departments);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Server Error" });
//     }
// };

const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().populate("service", "name");

        const result = await Promise.all(
            departments.map(async (dept) => {
                const employees = await User.find({
                    department: dept._id,
                    assignedService: dept.service._id
                })
                    .select("name email role empId designation") 
                    .populate("designation", "name"); 

                return {
                    _id: dept._id,
                    name: dept.name,
                    service: dept.service,
                    employees
                };
            })
        );

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};


// Get single department by ID
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id).populate("service", "name");

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        res.json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Update department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, service } = req.body;

        const updatedDepartment = await Department.findByIdAndUpdate(
            id,
            { name, description, service },
            { new: true, runValidators: true }
        );

        if (!updatedDepartment) {
            return res.status(404).json({ error: "Department not found" });
        }

        res.json(updatedDepartment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Delete department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDepartment = await Department.findByIdAndDelete(id);

        if (!deletedDepartment) {
            return res.status(404).json({ error: "Department not found" });
        }

        res.json({ message: "Department deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment }
