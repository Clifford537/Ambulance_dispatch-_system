const express = require("express");
const router = express.Router();
const Ambulance = require("../models/Ambulance");
const { verifyAdmin } = require("../middleware/authMiddleware"); // Import middleware

// Create an ambulance (Admins only)
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { license_plate, status, hospital_name, location } = req.body;

        // Ensure required fields are provided
        if (!license_plate || !status || !location || !location.coordinates) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Validate status
        const validStatuses = ["available", "on-duty", "maintenance"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Debugging: Log received coordinates
        console.log("Received coordinates:", location.coordinates);

        // Extract coordinates
        let [lat, lng] = location.coordinates; // Incoming order might be incorrect

        // Ensure correct coordinate order [longitude, latitude]
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            console.warn("Swapping coordinates due to invalid order...");
            [lng, lat] = [lat, lng]; // Swap values
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                message: "Invalid coordinates",
                received: location.coordinates,
                expected_format: "Coordinates should be [longitude, latitude]"
            });
        }

        // Construct corrected location
        const correctedLocation = {
            type: "Point",
            coordinates: [lng, lat] // ✅ Longitude first, Latitude second
        };

        // Debugging: Log corrected location
        console.log("Corrected coordinates:", correctedLocation.coordinates);

        // Create and save the ambulance
        const ambulance = new Ambulance({
            license_plate,
            status,
            hospital_name,
            location: correctedLocation
        });

        await ambulance.save();

        res.status(201).json({ message: "Ambulance created successfully", ambulance });
    } catch (error) {
        console.error("Error saving ambulance:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// get all ambulances
router.get("/", verifyAdmin, async (req, res) => {
    try {
        const ambulances = await Ambulance.find();
        res.status(200).json({ message: "Ambulances retrieved successfully", ambulances });
    } catch (error) {
        console.error("Error fetching ambulances:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Update an ambulance (Admin only)
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { license_plate, status, hospital_name, location } = req.body;

        // Validate status if provided
        const validStatuses = ["available", "on-duty", "maintenance"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Handle location validation and correction if provided
        let correctedLocation;
        if (location && location.coordinates) {
            let [lat, lng] = location.coordinates;
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) [lng, lat] = [lat, lng]; // Swap if needed
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ message: "Invalid coordinates" });
            }
            correctedLocation = { type: "Point", coordinates: [lng, lat] };
        }

        // Update ambulance
        const updatedAmbulance = await Ambulance.findByIdAndUpdate(
            id,
            {
                license_plate,
                status,
                hospital_name,
                location: correctedLocation || undefined
            },
            { new: true, runValidators: true }
        );

        if (!updatedAmbulance) {
            return res.status(404).json({ message: "Ambulance not found" });
        }

        res.status(200).json({ message: "Ambulance updated successfully", ambulance: updatedAmbulance });
    } catch (error) {
        console.error("Error updating ambulance:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete an ambulance (Admin only)
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAmbulance = await Ambulance.findByIdAndDelete(id);

        if (!deletedAmbulance) {
            return res.status(404).json({ message: "Ambulance not found" });
        }

        res.status(200).json({ message: "Ambulance deleted successfully" });
    } catch (error) {
        console.error("Error deleting ambulance:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
