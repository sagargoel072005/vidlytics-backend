// const IORedis = require("ioredis");

// const redis = new IORedis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
//   maxRetriesPerRequest: null,
// });

// redis.on("error", (err) => {
//   console.error("Redis connection error:", err.message);
// });

// module.exports = redis;

const IORedis = require("ioredis");

const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Redis Connected Successfully");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

module.exports = redis;
