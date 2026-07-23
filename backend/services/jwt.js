const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "loyalchain-super-secret-key-2026";

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
