require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","), credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "LoyalChain API", version: "2.0" }));
app.get("/api/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/points", require("./routes/points"));
app.use("/api/merchant", require("./routes/merchant"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/qr", require("./routes/qr"));
app.use("/api/swap", require("./routes/swap"));

if (process.env.NODE_ENV !== "production") {
  app.post("/api/test/reset", async (req, res) => {
    const prisma = require("./services/prisma");
    await prisma.transaction.deleteMany({});
    await prisma.merchant.deleteMany({});
    await prisma.user.deleteMany({});
    res.json({ ok: true });
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

app.listen(PORT, () => console.log(`LoyalChain API → http://localhost:${PORT}`));
