// const express =require("express");
// const sseRouter = express.Router();

// const {addClient, removeClient}= require("../utils/sseManager");

// sseRouter.get( "/:jobId/progress",(req, res) => {

//         res.setHeader(
//             "Content-Type",
//             "text/event-stream"
//         );

//         res.setHeader(
//             "Cache-Control",
//             "no-cache"
//         );
//         res.setHeader("Connection", "keep-alive");
//         res.setHeader("X-Accel-Buffering", "no");

//         const { jobId } =
//             req.params;

//         addClient(
//             jobId,
//             res
//         );

//         req.on(
//             "close",
//             () => {
//                 removeClient(jobId);
//             }
//         );

//     });
    
const express = require("express");
const sseRouter = express.Router();

const { addClient, removeClient } = require("../utils/sseManager");
const comparisonQueue = require("../queues/comparisonQueue");
const studyQueue = require("../queues/studyQueue");

sseRouter.get("/:jobId/progress", async (req, res) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();
  res.write(": connected\n\n");

  addClient(jobId, res);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": keep-alive\n\n");
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(jobId);
  });

  // Recover progress events that happened before SSE connected
  try {
let job =
  await studyQueue.getJob(jobId);

if (!job) {
  job = await comparisonQueue.getJob(jobId);
}

if (job && job.progress) {
  res.write(
    `data: ${JSON.stringify(job.progress)}\n\n`
  );
}
  } catch (err) {
    console.error("SSE progress recovery error:", err.message);
  }
});

module.exports = sseRouter;


// module.exports = sseRouter;


