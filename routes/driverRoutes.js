const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const User = require("../models/User");
const { verifyAdmin } = require("../middleware/authMiddleware");

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
router.post("/create", verifyAdmin, async (req, res) => {
    try {
        const { user_id, license_number, assigned_ambulance } = req.body;

        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const existingDriver = await Driver.findOne({ user: user_id });
        if (existingDriver) return res.status(400).json({ message: "User is already a driver" });

        user.role = "driver";
        await user.save();

        const driver = new Driver({ user: user_id, license_number, assigned_ambulance });
        await driver.save();

        res.status(201).json({ message: "Driver created successfully", driver });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
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
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { license_number, assigned_ambulance } = req.body;
        const driver = await Driver.findById(req.params.id);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        if (license_number) driver.license_number = license_number;
        if (assigned_ambulance !== undefined) driver.assigned_ambulance = assigned_ambulance;

        await driver.save();
        res.status(200).json({ message: "Driver updated successfully", driver });
    } catch (error) {
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
        const driver = await Driver.findById(req.params.id).populate("user");
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        await User.findByIdAndUpdate(driver.user._id, { role: "user" });
        await Driver.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Driver role revoked, user reverted to regular user" });
    } catch (error) {
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
router.get("/", verifyAdmin, async (req, res) => {
    try {
        const drivers = await Driver.find().populate("user", "name email phone_number_1 role");
        res.status(200).json(drivers);
    } catch (error) {
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
router.get("/:id", verifyAdmin, async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id)
            .populate("user", "name email phone_number_1 role")
            .populate("assigned_ambulance", "license_plate status hospital_name location");

        if (!driver) return res.status(404).json({ message: "Driver not found" });

        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
