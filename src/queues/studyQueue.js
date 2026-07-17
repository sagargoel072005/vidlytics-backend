const { Queue } = require("bullmq");
const redis = require("../config/redis");

const studyQueue = new Queue("studyQueue", {
  connection: redis,
});

module.exports = studyQueue;