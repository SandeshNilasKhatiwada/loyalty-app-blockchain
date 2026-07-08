require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const pointsRoutes = require("./routes/points");
const merchantRoutes = require("./routes/merchant");
const transactionRoutes = require("./routes/transactions");
const qrRoutes = require("./routes/qr");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "LoyalChain API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
// app.use('/api/points', pointsRoutes); // uncomment later
app.use("/api/admin", adminRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/qr", qrRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
