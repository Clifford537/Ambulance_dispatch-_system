const express = require("express");
const router = express.Router();
const Ambulance = require("../models/Ambulance");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Ambulance:
 *       type: object
 *       required:
 *         - license_plate
 *         - status
 *         - hospital_name
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the ambulance
 *         license_plate:
 *           type: string
 *           description: License plate of the ambulance
 *         status:
 *           type: string
 *           enum: [available, on-duty, maintenance]
 *           description: The current status of the ambulance
 *         hospital_name:
 *           type: string
 *           description: The hospital associated with the ambulance
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [longitude, latitude]
 *           description: The location of the ambulance
 */

/**
 * @swagger
 * /api/ambulances:
 *   post:
 *     summary: Create a new ambulance
 *     security:
 *       - bearerAuth: []
 *     tags: [Ambulances]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ambulance'
 *     responses:
 *       201:
 *         description: Ambulance created successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       500:
 *         description: Server error
 */
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { license_plate, status, hospital_name, location } = req.body;

        if (!license_plate || !status || !location || !location.coordinates) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const validStatuses = ["available", "on-duty", "maintenance"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        let [lat, lng] = location.coordinates;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) [lng, lat] = [lat, lng];

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ message: "Invalid coordinates" });
        }

        const correctedLocation = {
            type: "Point",
            coordinates: [lng, lat]
        };

        const ambulance = new Ambulance({
            license_plate,
            status,
            hospital_name,
            location: correctedLocation
        });

        await ambulance.save();
        res.status(201).json({ message: "Ambulance created successfully", ambulance });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/ambulances:
 *   get:
 *     summary: Get all ambulances
 *     security:
 *       - bearerAuth: []
 *     tags: [Ambulances]
 *     responses:
 *       200:
 *         description: List of all ambulances
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const ambulances = await Ambulance.find();
        res.status(200).json({ message: "Ambulances retrieved successfully", ambulances });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/ambulances/{id}:
 *   put:
 *     summary: Update an ambulance
 *     security:
 *       - bearerAuth: []
 *     tags: [Ambulances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ambulance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ambulance'
 *     responses:
 *       200:
 *         description: Ambulance updated successfully
 *       404:
 *         description: Ambulance not found
 *       500:
 *         description: Server error
 */
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { license_plate, status, hospital_name, location } = req.body;

        const validStatuses = ["available", "on-duty", "maintenance"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        let correctedLocation;
        if (location && location.coordinates) {
            let [lat, lng] = location.coordinates;
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) [lng, lat] = [lat, lng];
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ message: "Invalid coordinates" });
            }
            correctedLocation = { type: "Point", coordinates: [lng, lat] };
        }

        const updatedAmbulance = await Ambulance.findByIdAndUpdate(
            id,
            { license_plate, status, hospital_name, location: correctedLocation || undefined },
            { new: true, runValidators: true }
        );

        if (!updatedAmbulance) {
            return res.status(404).json({ message: "Ambulance not found" });
        }

        res.status(200).json({ message: "Ambulance updated successfully", ambulance: updatedAmbulance });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/ambulances/{id}:
 *   delete:
 *     summary: Delete an ambulance
 *     security:
 *       - bearerAuth: []
 *     tags: [Ambulances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ambulance ID
 *     responses:
 *       200:
 *         description: Ambulance deleted successfully
 *       404:
 *         description: Ambulance not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const deletedAmbulance = await Ambulance.findByIdAndDelete(req.params.id);
        if (!deletedAmbulance) return res.status(404).json({ message: "Ambulance not found" });

        res.status(200).json({ message: "Ambulance deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
