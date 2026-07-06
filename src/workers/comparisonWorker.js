const { Worker } = require("bullmq");
const redis = require("../config/redis");
const Comparison = require("../models/Comparision");
const { getTranscript } = require("../services/transcriptService");
const { compareVideos } = require("../services/geminiService");
const { sendProgress } = require("../utils/sseManager");
const { saveTranscriptToQdrant } = require("../services/embeddingService");

const worker = new Worker(
  "comparisonQueue",

  async (job) => {
    const { userId, video1, video2 } = job.data;

    let comparison;

    try {
      sendProgress(job.id, { progress: 10, message: "Transcript 1" });
      const transcript1 = await getTranscript(video1);
      console.log("✅ Transcript 1 fetched, length:", transcript1?.length);

      sendProgress(job.id, { progress: 30, message: "Transcript 2" });
      const transcript2 = await getTranscript(video2);
      console.log("✅ Transcript 2 fetched, length:", transcript2?.length);

      sendProgress(job.id, { progress: 60, message: "Vidlytics Analysis" });

      comparison = await Comparison.create({
        userId,
        video1,
        video2,
        transcript1,
        transcript2,
        aiResult: null,
      });
      console.log("✅ Comparison doc created:", comparison._id.toString());

      // Qdrant embeddings — inko bhi try/catch me isolate karo taaki
      // yeh fail ho toh bhi poori comparison fail na ho
      try {
        await saveTranscriptToQdrant(comparison._id.toString(), transcript1);
        await saveTranscriptToQdrant(comparison._id.toString(), transcript2);
        console.log("✅ Qdrant embeddings saved");
      } catch (qdrantErr) {
        console.error("⚠️ Qdrant save failed (non-fatal):", qdrantErr.message);
      }

      console.log("⏳ Calling Gemini...");
      const result = await compareVideos(transcript1, transcript2);
      console.log("✅ Gemini raw result:", result);

      comparison.aiResult = result;
      await comparison.save();
      console.log("✅ aiResult saved to DB");

      sendProgress(job.id, {
        progress: 100,
        message: "Completed",
        comparisonId: comparison._id.toString(),
      });

      return result;
    } catch (err) {
      // 🔴 Yahi pe pata chalega asli error — Gemini key/quota, transcript fetch, etc.
      console.error("❌ Comparison job failed:", err.message);
      console.error(err); // full stack trace

      sendProgress(job.id, {
        progress: 100,
        error: true,
        message: err.message || "Comparison failed",
        comparisonId: comparison?._id?.toString() || null,
      });

      throw err; // BullMQ ko job failed mark karne do
    }
  },

  {
    connection: redis,
  }
);

// Extra safety — worker-level events, BullMQ inko emit karta hai
worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err.message);
});

module.exports = worker;