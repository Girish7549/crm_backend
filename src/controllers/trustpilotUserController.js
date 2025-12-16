const trustpilotUser = require("../models/trustpilotUser");

// --------------------
// Create or Update Google User
// --------------------
const upsertGoogleUser = async (req, res) => {
    try {
        const { googleId, firstName, lastName, email, profileImage, gender, dob } = req.body;

        if (!googleId || !firstName || !email) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user exists
        let user = await trustpilotUser.findOne({ googleId });

        if (user) {
            // Update existing user
            user.firstName = firstName;
            user.lastName = lastName;
            user.email = email;
            user.profileImage = profileImage || user.profileImage;
            user.gender = gender || user.gender;
            user.dob = dob || user.dob;

            await user.save();
            return res.status(200).json({ message: "User updated", user });
        } else {
            // Create new user
            user = new trustpilotUser({
                googleId,
                firstName,
                lastName,
                email,
                profileImage,
                gender,
                dob,
            });

            await user.save();
            return res.status(201).json({ message: "User created", user });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// --------------------
// Get User by ID
// --------------------
const getTrustpilotUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await trustpilotUser.findById(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// --------------------
// Get All Users
// --------------------
const getAllTruspilotUser = async (req, res) => {
    try {
        const users = await trustpilotUser.find().sort({ createdAt: -1 });
        return res.status(200).json({ users });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// --------------------
// Update User
// --------------------
const updateTrustpilotUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const user = await trustpilotUser.findByIdAndUpdate(id, updates, { new: true });

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: "User updated", user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// --------------------
// Delete User
// --------------------
const deleteTruspilotUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await trustpilotUser.findByIdAndDelete(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: "User deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = { upsertGoogleUser, getTrustpilotUserById, getAllTruspilotUser, updateTrustpilotUser, deleteTruspilotUser }