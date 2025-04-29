const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ensure User model is imported

// Middleware to verify token and check admin role
const verifyAdmin = async (req, res, next) => {
    try {
        // Get token from headers
        let token = req.header("Authorization");
        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Ensure token is in Bearer format
        if (token.startsWith("Bearer ")) {
            token = token.slice(7).trim(); // Remove "Bearer " prefix
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
        req.user = decoded; // Attach user data to request

        // Check if the user exists
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found. Invalid token." });
        }

        // Check if user is an admin
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        next(); // Allow request to proceed
    } catch (error) {
        console.error("Token verification error:", error.message);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please log in again." });
        }
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware to verify token and check admin/driver role
const verifyAdminOrDriver = async (req, res, next) => {
    try {
        // Get token from headers
        let token = req.header("Authorization");
        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Ensure token is in Bearer format
        if (token.startsWith("Bearer ")) {
            token = token.slice(7).trim(); // Remove "Bearer " prefix
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
        req.user = decoded; // Attach user data to request

        // Check if the user exists
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found. Invalid token." });
        }

        // Check if the user is an admin or the owner of the data
        if (user.role !== "admin" && user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: "Access denied." });
        }

        next(); // Allow request to proceed
    } catch (error) {
        console.error("Token verification error:", error.message);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please log in again." });
        }
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware to verify a valid token
const verifyToken = (req, res, next) => {
    try {
        let token = req.header("Authorization");
        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        if (token.startsWith("Bearer ")) {
            token = token.slice(7).trim(); // Remove "Bearer " prefix
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
        req.user = decoded; // Attach user data to request

        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please log in again." });
        }
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = { verifyToken, verifyAdmin,verifyAdminOrDriver };
