require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

const app = express();

const authRoutes = require("./routes/auth");
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
          ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "LoyalChain API" });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
