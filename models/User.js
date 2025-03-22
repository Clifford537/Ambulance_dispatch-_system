const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "dispatcher", "user","driver","medic"], required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, 
    phone_number_1: { type: String, required: true },
    phone_number_2: { type: String }
});

module.exports = mongoose.model("User", userSchema);
