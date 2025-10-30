const Company = require("../models/Company");

// ✅ Create company
const createCompany = async (req, res) => {
    try {
        const { name } = req.body;

        const newCompany = new Company({ name });
        await newCompany.save();

        res.status(200).json({
            success: true,
            message: "Company created successfully",
            data: newCompany,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ✅ Get all companies
const getAllCompany = async (req, res) => {
    try {
        const companies = await Company.find();

        res.status(200).json({
            success: true,
            message: "Companies fetched successfully",
            data: companies,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ✅ Get company by ID
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Company fetched successfully",
            data: company,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ✅ Update company by ID
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updatedCompany = await Company.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: updatedCompany,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ✅ Delete company by ID
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCompany = await Company.findByIdAndDelete(id);

        if (!deletedCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Company deleted successfully",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    createCompany,
    getAllCompany,
    getCompanyById,
    updateCompany,
    deleteCompany,
};
