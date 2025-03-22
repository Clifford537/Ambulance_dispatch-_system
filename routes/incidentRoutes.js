const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");
const User = require("../models/User");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

// 📌 Create an incident (Accessible to any logged-in user)
router.post("/create", verifyToken, async (req, res) => {
    try {
        const { location, incident_type, priority } = req.body;

        if (!location || !location.coordinates || !incident_type || !priority) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Validate coordinate format
        let [lat, lng] = location.coordinates;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            [lng, lat] = [lat, lng]; // Swap if incorrect
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ message: "Invalid coordinates" });
        }

        // Fetch user details from token
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const correctedLocation = {
            type: "Point",
            coordinates: [lng, lat] // Longitude first
        };

        const newIncident = new Incident({
            user: req.user.userId,
            phone: user.phone_number_1, // Auto-fetch phone from user details
            location: correctedLocation,
            incident_type,
            priority
        });

        await newIncident.save();
        res.status(201).json({ message: "Incident reported successfully", incident: newIncident });
    } catch (error) {
        console.error("Error creating incident:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 📌 Get all incidents with full user details (Admin only)
router.get("/view", verifyAdmin, async (req, res) => {
    try {
        const incidents = await Incident.find()
            .populate("user", "name email phone_number_1 phone_number_2 role date_of_birth location");

        res.status(200).json(incidents);
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 📌 Get a specific incident by ID (Admin only)
router.get("/:id", verifyAdmin, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate("user", "name email phone_number_1 phone_number_2 role date_of_birth location");

        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        res.status(200).json(incident);
    } catch (error) {
        console.error("Error fetching incident:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 📌 Delete an incident (Admin only)
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        await Incident.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Incident deleted successfully" });
    } catch (error) {
        console.error("Error deleting incident:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
