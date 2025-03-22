const mongoose = require("mongoose");

const medicSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    specialty: { type: String },
    assigned_ambulance: { type: mongoose.Schema.Types.ObjectId, ref: "Ambulance", default: null }
});

module.exports = mongoose.model("Medic", medicSchema);
