const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const User = require("../models/User");
const { verifyAdmin} = require("../middleware/authMiddleware");

// Create a driver (Admins only)
router.post("/create", verifyAdmin, async (req, res) => {
    try {
        const { user_id, license_number, assigned_ambulance } = req.body;

        // Check if the user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure the user is not already a driver
        const existingDriver = await Driver.findOne({ user: user_id });
        if (existingDriver) {
            return res.status(400).json({ message: "User is already a driver" });
        }

        // Update the user's role to "driver"
        user.role = "driver";
        await user.save();

        // Create a new driver entry
        const driver = new Driver({
            user: user_id,
            license_number,
            assigned_ambulance
        });

        await driver.save();

        res.status(201).json({ message: "Driver created successfully", driver });
    } catch (error) {
        console.error("Error creating driver:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update driver details
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { license_number, assigned_ambulance } = req.body;
        const driverId = req.params.id;

        // Find the driver
        let driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Update details
        if (license_number) driver.license_number = license_number;
        if (assigned_ambulance !== undefined) driver.assigned_ambulance = assigned_ambulance;

        await driver.save();

        res.status(200).json({ message: "Driver updated successfully", driver });
    } catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Revoke driver status (convert back to user)
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the driver entry
        const driver = await Driver.findById(id).populate("user");
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Revert user role back to "user"
        await User.findByIdAndUpdate(driver.user._id, { role: "user" });

        // Remove the driver entry
        await Driver.findByIdAndDelete(id);

        res.status(200).json({ message: "Driver role revoked, user reverted to regular user" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get all drivers
router.get("/", verifyAdmin, async (req, res) => {
    try {
        const drivers = await Driver.find().populate("user", "name email phone_number_1 role");
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Get a specific driver by ID
router.get("/:id", verifyAdmin, async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id)
            .populate("user", "name email phone_number_1 role") // Get user details
            .populate("assigned_ambulance", "license_plate status hospital_name location"); // Get ambulance details

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
