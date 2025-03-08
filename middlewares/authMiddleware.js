const jwt = require("jsonwebtoken");
const User = require("../models/user");

// ✅ Authenticate user (must be logged in)
exports.authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: "User not found." });
        }

        req.user = user; // ✅ Attach user to request
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// ✅ Authorize Admin Only
exports.authorizeAdmin = (req, res, next) => {
    try {
        // ✅ Check if req.user exists
        if (!req.user) {
            return res.status(403).json({ error: "Unauthorized: No user found" });
        }

        // ✅ Check if user is an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized: Admins only" });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error in authorization" });
    }
};
