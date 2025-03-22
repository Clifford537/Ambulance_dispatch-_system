const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // References the user
    license_number: { type: String, unique: true, required: true },
    assigned_ambulance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ambulance",
        unique: true, // Only one driver per ambulance
        default: null
    }
});

module.exports = mongoose.model("Driver", driverSchema);
