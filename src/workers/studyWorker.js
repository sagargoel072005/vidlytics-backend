const { Worker } = require("bullmq");
const redis = require("../config/redis");
const StudySession = require("../models/StudySession");
const { getTranscript } = require("../services/transcriptService");
const { generateStudyMaterial } = require("../services/geminiService");
const { sendProgress } = require("../utils/sseManager");
const { saveTranscriptToQdrant } = require("../services/embeddingService");

// Cheap, no-auth way to grab the video title — doesn't need the API key
// or extra yt-dlp calls. Non-fatal if it fails.
const fetchVideoTitle = async (videoUrl) => {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || null;
  } catch {
    return null;
  }
};

const worker = new Worker(
  "studyQueue",

  async (job) => {
    const { userId, videoUrl } = job.data;

    let studySession;

    try {
      sendProgress(job.id, { progress: 10, message: "Fetching video info" });
      const videoTitle = await fetchVideoTitle(videoUrl);

      sendProgress(job.id, { progress: 25, message: "Fetching transcript" });
      const transcript = await getTranscript(videoUrl);
      console.log("✅ Transcript fetched, length:", transcript?.length);

      sendProgress(job.id, { progress: 50, message: "Saving session" });

      studySession = await StudySession.create({
        userId,
        videoUrl,
        videoTitle,
        transcript,
        aiResult: null,
      });
      console.log("✅ StudySession doc created:", studySession._id.toString());

      // Non-fatal — chat should still work off the saved transcript even if
      // embeddings fail, RAG chat will just be less precise.
      try {
        await saveTranscriptToQdrant(studySession._id.toString(), transcript);
        console.log("✅ Qdrant embeddings saved");
      } catch (qdrantErr) {
        console.error("⚠️ Qdrant save failed (non-fatal):", qdrantErr.message);
      }

      sendProgress(job.id, { progress: 70, message: "Generating study kit" });

      console.log("⏳ Calling Gemini...");
      const result = await generateStudyMaterial(transcript);
      console.log("✅ Gemini raw result:", result);

      studySession.aiResult = result;
      await studySession.save();
      console.log("✅ aiResult saved to DB");

      sendProgress(job.id, {
        progress: 100,
        message: "Completed",
        studyId: studySession._id.toString(),
      });

      return result;
    } catch (err) {
      console.error("❌ Study job failed:", err.message);
      console.error(err);

      sendProgress(job.id, {
        progress: 100,
        error: true,
        message: err.message || "Study session generation failed",
        studyId: studySession?._id?.toString() || null,
      });

      throw err;
    }
  },

  {
    connection: redis,
  }
);

worker.on("failed", (job, err) => {
  console.error(`❌ Study job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Study worker error:", err.message);
});

module.exports = worker;