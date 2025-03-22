const express = require("express");
const router = express.Router();
const Medic = require("../models/Medic");
const User = require("../models/User");
const Ambulance = require("../models/Ambulance");
const { verifyAdmin } = require("../middleware/authMiddleware");

// ✅ **Create Medic (Admin only)**
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { user_id, specialty, assigned_ambulance } = req.body;

        // Validate user
        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === "medic") return res.status(400).json({ message: "User is already a medic" });

        // Update user role to medic
        user.role = "medic";
        await user.save();

        // Create Medic
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

//  **Get All Medics**
router.get("/", async (req, res) => {
    try {
        const medics = await Medic.find().populate("user", "name email phone_number_1 role").populate("assigned_ambulance", "license_plate hospital_name");
        res.status(200).json(medics);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//  **Get Medic by ID**
router.get("/:id", async (req, res) => {
    try {
        const medic = await Medic.findById(req.params.id).populate("user", "name email phone_number_1 role").populate("assigned_ambulance", "license_plate hospital_name");
        if (!medic) return res.status(404).json({ message: "Medic not found" });

        res.status(200).json(medic);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//  **Update Medic Details**
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

//  **Delete Medic (Revoke Medic Role)**
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const medic = await Medic.findById(req.params.id);
        if (!medic) return res.status(404).json({ message: "Medic not found" });

        // Update user role back to normal
        const user = await User.findById(medic.user);
        if (user) {
            user.role = "user";
            await user.save();
        }

        await medic.deleteOne();
        res.status(200).json({ message: "Medic deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
