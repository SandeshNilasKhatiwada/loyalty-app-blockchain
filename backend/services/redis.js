const Redis = require("ioredis");

const url = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(url);

redis.on("error", (err) => console.error("Redis error:", err.message));

module.exports = redis;
