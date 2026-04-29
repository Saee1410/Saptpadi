const User = require('../models/User');
const Booking = require('../models/Booking');

// 1. Function name check kara: getUserById (r sobat)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });  
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).select('-password');

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateVendorProfile = async (req, res) => {
    try {
        const { businessName, contact } = req.body;
        const updatedVendor = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { businessName, contact } },
            { new: true }
        ).select('-password');

        if (!updatedVendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }

        res.status(200).json({ success: true, user: updatedVendor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


const updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const {name, contact} = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, contact },
            { new: true, runValidators: true }
        );

        if(!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (err) {
        console.error("Update Backend Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while updating profile",
            error: err.message
        });
    }
}


module.exports = { getUserById, updateUserProfile, updateVendorProfile, updateUser };