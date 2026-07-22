require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

const app = express();
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowed = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());

// Mock user for testing
const MOCK_USER = {
  id: "1",
  email: "demo@example.com",
  password: "$2a$10$ABCDEFG...", // we'll use plain password for now
};

// Simple login endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // For now, accept any email/password combination for testing
  // In production, check against database
  if (email === "demo@example.com" && password === "password123") {
    const token = jwt.sign(
      { userId: "1", email: "demo@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    return res.json({
      success: true,
      token,
      user: {
        id: "1",
        email: "demo@example.com",
        name: "Demo User",
      },
    });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Protected route example
app.get("/api/protected", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: "You are authenticated!", user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
