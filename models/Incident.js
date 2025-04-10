const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  phone: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  incident_type: { type: String, required: true },
  priority: { type: Number, required: true, min: 1, max: 5 },
  status: { type: String, enum: ["pending", "dispatched", "resolved"], required: true, default: "pending" },
  reported_time: { type: Date, default: Date.now },
  ambulance: { type: mongoose.Schema.Types.ObjectId, ref: "Ambulance", default: null } // New field for dispatched ambulance
});

// Enable geospatial queries
incidentSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Incident", incidentSchema);
