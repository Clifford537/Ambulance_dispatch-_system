const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema({
    license_plate: { type: String, unique: true, required: true },
    status: { type: String, enum: ["available", "on-duty", "maintenance"], required: true },
    hospital_name: { type: String },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
});

// Enable geospatial queries
ambulanceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Ambulance", ambulanceSchema);
