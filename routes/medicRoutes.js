const express = require("express");
const router = express.Router();
const Medic = require("../models/Medic");
const User = require("../models/User");
const Ambulance = require("../models/Ambulance");
const { verifyAdmin } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Medics
 *   description: Medic management API
 */

/**
 * @swagger
 * /api/medics:
 *   post:
 *     summary: Create a new medic (Admin only)
 *     tags: [Medics]
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
 *               specialty:
 *                 type: string
 *               assigned_ambulance:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medic created successfully
 *       400:
 *         description: User is already a medic
 *       404:
 *         description: User not found
 */
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { user_id, specialty, assigned_ambulance } = req.body;
        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === "medic") return res.status(400).json({ message: "User is already a medic" });

        user.role = "medic";
        await user.save();

        const medic = new Medic({
            user: user._id,
            name: user.name,
            phone: user.phone_number_1,
            specialty,
            assigned_ambulance: assigned_ambulance || null,
            role: user.role
        });
        await medic.save();
        res.status(201).json({ message: "Medic created successfully", medic });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/medics:
 *   get:
 *     summary: Get all medics
 *     tags: [Medics]
 *     responses:
 *       200:
 *         description: List of all medics
 */
router.get("/", async (req, res) => {
    try {
        const medics = await Medic.find().populate("user", "name email phone_number_1 role").populate("assigned_ambulance", "license_plate hospital_name");
        res.status(200).json(medics);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/medics/{id}:
 *   get:
 *     summary: Get a medic by ID
 *     tags: [Medics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medic found
 *       404:
 *         description: Medic not found
 */
router.get("/:id", async (req, res) => {
    try {
        const medic = await Medic.findById(req.params.id).populate("user", "name email phone_number_1 role").populate("assigned_ambulance", "license_plate hospital_name");
        if (!medic) return res.status(404).json({ message: "Medic not found" });
        res.status(200).json(medic);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @swagger
 * /api/medics/{id}:
 *   put:
 *     summary: Update a medic's details (Admin only)
 *     tags: [Medics]
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
 *               specialty:
 *                 type: string
 *               assigned_ambulance:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medic updated successfully
 *       404:
 *         description: Medic not found
 */
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { specialty, assigned_ambulance } = req.body;
        const medic = await Medic.findById(req.params.id);
        if (!medic) return res.status(404).json({ message: "Medic not found" });

        if (specialty) medic.specialty = specialty;
        if (assigned_ambulance) medic.assigned_ambulance = assigned_ambulance;

        await medic.save();
        res.status(200).json({ message: "Medic updated successfully", medic });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
