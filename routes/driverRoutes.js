const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const User = require("../models/User");
const Ambulance = require("../models/Ambulance"); 

const { verifyAdmin,verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Driver management API
 */

/**
 * @swagger
 * /api/drivers/create:
 *   post:
 *     summary: Create a new driver (Admin only)
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               license_number:
 *                 type: string
 *               assigned_ambulance:
 *                 type: string
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       400:
 *         description: User is already a driver
 *       404:
 *         description: User not found
 */
// Create a driver

// Create driver
router.post("/create", verifyAdmin, async (req, res) => {
  try {
    const { user_id, license_number, assigned_ambulance } = req.body;

    // Validate the incoming data
    if (!user_id || !license_number) {
      return res.status(400).json({ message: "User ID and License Number are required" });
    }

    // Find the user by user_id
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's role to "driver"
    user.role = "driver";
    await user.save(); // Save the updated user

    // Check if the assigned ambulance exists (optional)
    let ambulanceData = null;
    if (assigned_ambulance) {
      ambulanceData = await Ambulance.findById(assigned_ambulance);
      if (!ambulanceData) {
        return res.status(404).json({ message: "Ambulance not found" });
      }
    }

    // Create a new driver document
    const newDriver = new Driver({
      user_id: user._id, // Reference to the updated user
      license_number,
      assigned_ambulance: ambulanceData ? ambulanceData._id : null // Optional ambulance
    });

    // Save the new driver document to the database
    await newDriver.save();

    res.status(201).json({ message: "Driver created successfully", driver: newDriver });
  } catch (err) {
    console.error("Driver creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


/**
 * @swagger
 * /api/drivers/{id}:
 *   put:
 *     summary: Update a driver's details (Admin only)
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_number:
 *                 type: string
 *               assigned_ambulance:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       404:
 *         description: Driver not found
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const drivers = await Driver.find().populate("user_id", "name email phone_number_1"); 
        res.status(200).json(drivers);
    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/drivers/{id}:
 *   delete:
 *     summary: Revoke driver status (convert back to user)
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver role revoked, user reverted to regular user
 *       404:
 *         description: Driver not found
 */
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id).populate("user_id");
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        // Revert the user's role to "user"
        await User.findByIdAndUpdate(driver.user_id._id, { role: "user" });

        // Delete the driver document
        await Driver.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Driver role revoked, user reverted to regular user" });
    } catch (error) {
        console.error("Error deleting driver:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers (Admin only)
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all drivers
 */
// Driver Controller (PUT)
router.put("/:id", verifyAdmin, async (req, res) => {
    const { license_number, assigned_ambulance } = req.body; // Extract data from the request body

    try {
        // Find driver by ID
        const driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Update driver data
        driver.license_number = license_number || driver.license_number; // Only update if the field is provided
        driver.assigned_ambulance = assigned_ambulance || driver.assigned_ambulance; // Only update if the field is provided

        // Save the updated driver
        await driver.save();

        res.status(200).json({ message: "Driver updated successfully", driver });
    } catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


/**
 * @swagger
 * /api/drivers/{id}:
 *   get:
 *     summary: Get a specific driver by ID (Admin only)
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver found
 *       404:
 *         description: Driver not found
 */
// Driver Controller (GET by ID)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        // Find the driver by ID and populate the user details
        const driver = await Driver.findById(req.params.id).populate("user_id", "name email phone_number_1");

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json(driver);
    } catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});







module.exports = router;
