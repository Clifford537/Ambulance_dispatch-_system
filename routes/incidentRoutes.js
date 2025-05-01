const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");
const User = require("../models/User");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");// Assuming you have a User model
const Ambulance = require("../models/Ambulance"); 

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Incident management API
 */

/**
 * @swagger
 * /api/incidents/create:
 *   post:
 *     summary: Report a new incident (Logged-in users only)
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               incident_type:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident reported successfully
 *       400:
 *         description: Missing required fields or invalid coordinates
 */
// Route to create a new incident

router.post("/create", verifyToken, async (req, res) => {
    try {
      const { location, incident_type, priority, ambulanceId } = req.body;
  
      // Check if required fields are provided
      if (!location || !location.coordinates || !incident_type || !priority) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      let [lat, lng] = location.coordinates;
  
      // Validate coordinates
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        [lng, lat] = [lat, lng]; // Swap if coordinates are in wrong order
      }
  
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
  
      // Fetch the user from the token (middleware verifies the token)
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Fetch the ambulance if provided
      let ambulance = null;
      if (ambulanceId) {
        ambulance = await Ambulance.findById(ambulanceId);
        if (!ambulance) {
          return res.status(404).json({ message: "Ambulance not found" });
        }
      }
  
      // Correct the location object to ensure it's in the proper format for geospatial queries
      const correctedLocation = {
        type: "Point",
        coordinates: [lng, lat]
      };
  
      // Create a new Incident
      const newIncident = new Incident({
        user: req.user.userId,
        phone: user.phone_number_1, // Assuming the user model has phone_number_1
        location: correctedLocation,
        incident_type,
        priority,
        ambulance: ambulance ? ambulance._id : null // Associate the ambulance if it's provided
      });
  
      // Save the new incident to the database
      await newIncident.save();
  
      // Respond with a success message and the created incident
      res.status(201).json({ message: "Incident reported successfully", incident: newIncident });
    } catch (error) {
      console.error("Error creating incident:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  router.get("/", verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Fetch incidents and populate 'user' with 'name' and 'phone_number_1'
      const incidents = await Incident.find()
        .populate("user", "name phone_number_1")  // Include 'name' and 'phone_number_1'
        .populate("ambulance", "license_plate status hospital_name")
        .sort({ reported_time: -1 });
  
      res.status(200).json({ incidents });
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
/**
 * @swagger
 * /api/incidents/view:
 *   get:
 *     summary: Get all incidents (Admin only)
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all incidents
 */


/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Get a specific incident by ID (Admin only)
 *     tags: [Incidents]
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
 *         description: Incident found
 *       404:
 *         description: Incident not found
 */
router.get("/user", verifyToken, async (req, res) => {
    try {
      // Get the logged-in user's details
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Fetch incidents created by the logged-in user
      const incidents = await Incident.find({ user: req.user.userId })
        .populate("ambulance", "license_plate status hospital_name") // Populate ambulance details
        .sort({ reported_time: -1 }); // Sort incidents by reported time (descending)
  
      // If no incidents are found
      if (incidents.length === 0) {
        return res.status(404).json({ message: "No incidents found for this user" });
      }
  
      // Return the incidents
      res.status(200).json({ incidents });
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  

/**
 * @swagger
 * /api/incidents/{id}:
 *   delete:
 *     summary: Delete an incident (Admin only)
 *     tags: [Incidents]
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
 *         description: Incident deleted successfully
 *       404:
 *         description: Incident not found
 */
// Route to approve and dispatch an ambulance to an incident

router.post("/:incidentId/approve", verifyToken, async (req, res) => {
    try {
      // Ensure the logged-in user is a dispatcher
      const user = await User.findById(req.user.userId);
      if (!user || user.role !== "dispatcher") {
        return res.status(403).json({ message: "Only dispatchers can approve incidents" });
      }
  
      const { incidentId } = req.params;
  
      // Find the incident
      const incident = await Incident.findById(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
  
      // Check if the incident is already dispatched
      if (incident.status === "dispatched") {
        return res.status(400).json({ message: "This incident is already dispatched" });
      }
  
      // Update the incident status to "dispatched"
      incident.status = "dispatched";
  
      // Save the updated incident
      await incident.save();
  
      res.status(200).json({
        message: "Incident approved and dispatched successfully",
        incident,
      });
    } catch (error) {
      console.error("Error approving incident:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

// PATCH to update incident status
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Incident.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Incident not found" });
        }

        res.status(200).json(updated);
    } catch (err) {
        console.error("Error updating incident:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

  // Route to revoke an incident and deny the request
router.post("/:incidentId/revoke", verifyToken, async (req, res) => {
    try {
      // Ensure the logged-in user is a dispatcher
      const user = await User.findById(req.user.userId);
      if (!user || user.role !== "dispatcher") {
        return res.status(403).json({ message: "Only dispatchers can revoke incidents" });
      }
  
      const { incidentId } = req.params;
  
      // Find the incident
      const incident = await Incident.findById(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
  
      // Check if the incident is already revoked
      if (incident.status === "request-denied") {
        return res.status(400).json({ message: "This incident has already been revoked" });
      }
  
      // Update the incident status to "request-denied"
      incident.status = "request-denied";
  
      // Save the updated incident
      await incident.save();
  
      res.status(200).json({
        message: "Incident request revoked successfully",
        incident,
      });
    } catch (error) {
      console.error("Error revoking incident:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  

module.exports = router;