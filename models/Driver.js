const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  license_number: { type: String, required: true },
  assigned_ambulance: { type: mongoose.Schema.Types.ObjectId, ref: "Ambulance", required: false },
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);
