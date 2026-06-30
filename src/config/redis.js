const IORedis = require("ioredis");

const redis = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  tls: {}
});

module.exports = redis;

