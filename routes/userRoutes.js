const express = require("express");
const router = express.Router();
const User = require("../models/User"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyAdmin , verifyToken } = require("../middleware/authMiddleware");


// Register User
router.post("/register", async (req, res) => {
    try {
        const { name, role, email, password, phone_number_1, phone_number_2 } = req.body;

        // Check if all required fields are provided
        if (!name || !role || !email || !password || !phone_number_1) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Check if phone_number_1 already exists
        const existingPhone1 = await User.findOne({ phone_number_1 });
        if (existingPhone1) {
            return res.status(400).json({ message: "Primary phone number already in use" });
        }

        // Check if phone_number_2 already exists (if provided)
        if (phone_number_2) {
            const existingPhone2 = await User.findOne({ phone_number_2 });
            if (existingPhone2) {
                return res.status(400).json({ message: "Secondary phone number already in use" });
            }
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            role,
            email,
            password: hashedPassword,  // Store hashed password
            phone_number_1,
            phone_number_2
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "30m" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, role: user.role, email: user.email },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//  GET all users (Admin Only)
router.get("/", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Exclude password from response
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


//  DELETE user by ID
router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Update user details
router.put("/update", verifyToken, async (req, res) => {
    try {
        const { name, email, role, phone_number_1, phone_number_2 } = req.body;

        // Ensure at least one field is provided
        if (!name && !email && !phone_number_1 && !phone_number_2 && !role) {
            return res.status(400).json({ message: "Provide at least one field to update." });
        }

        // Find user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Prevent updating email if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use." });
            }
        }

        // Prevent updating phone_number_1 if it already exists
        if (phone_number_1 && phone_number_1 !== user.phone_number_1) {
            const existingPhone = await User.findOne({ phone_number_1 });
            if (existingPhone) {
                return res.status(400).json({ message: "Phone number already in use." });
            }
        }

        // Update user details
        if (name) user.name = name;
        if (email) user.email = email;
        if(role) user.role= role;
        if (phone_number_1) user.phone_number_1 = phone_number_1;
        if (phone_number_2) user.phone_number_2 = phone_number_2;

        await user.save();

        res.json({ message: "User updated successfully.", user });

    } catch (error) {
        console.error("Update error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
